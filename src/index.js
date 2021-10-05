//apenas importando a funçao do express
const express = require('express');
const { v4: uuidv4 } = require("uuid");
const { request, response } = require('express');

const app = express();

app.use(express.json());

//array vazio
const customers = [];

//Middleware, sempre recebe request, response e next
function verifyExistsAccountCPF(request, response,next){
  const { cpf } = request.headers;
 
  const customer = customers.find(customer => customer.cpf === cpf);
  
  if(!customer) {
    return response.status(400).json({error: "Customer not found"});
  }
  
  request.customer = customer;
  return next();
}

function getBalance(statement){
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === "credit"){
      return acc + operation.amount;
    } else{
      return acc - operation.amount;
    }
  },0);
  return balance;
}
/* 
cpf - string
name - string 
id - uuid
statement []
 */


app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const id = uuidv4();
  
  const customerAlreadyExists = customers.some(
    (customer => customer.cpf === cpf)
  );

  if(customerAlreadyExists) {
    return response.status(400).json({error: "Customer already exists!"});
  };

  //bd fake, inserindo dados no array
  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  //retornando q deu tudo certo
  return response.status(201).send();
});

app.get("/statement/", verifyExistsAccountCPF, (request, response) => {
  const { customer } = request;
  
  return response.json(customer.statement);
});

app.post("/deposit", verifyExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if(balance < amount){
    return response.status(400).json({error: "insufficient funds"});
  };

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});
//funçao listen fala pro express startar a aplicaçao
app.listen(8080);
