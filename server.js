// imports here for express and pg
const pg = require('pg');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(require('morgan')('dev'));

const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory_db');
// app routes here
app.get('/api/employees', async (req, res, next) => {
    try {
      const SQL = ` 
      SELECT * from employees ORDER BY created_at DESC;
      `;
      const response = await client.query(SQL);
      res.send(response.rows);
    } catch(err) {
        next(err);
    }
});

app.get('/api/departments', async (req, res, next) => {
    try {
      const SQL = ` 
      SELECT * from departments;
      `;
      const response = await client.query(SQL);
      res.send(response.rows);
    } catch(err) {
        next(err);
    }
});

app.post('/api/employees', async (req, res, next) => {
    try {
      const SQL = ` 
      INSERT INTO employees(name, department_id)
      VALUES($1, $2)
      RETURNING *;
      `;
      const response = await client.query(SQL, [req.body.name, req.body.department_id]);
      res.send(response.rows[0]);
    } catch(err) {
        next(err);
    }
});

app.put('/api/employees/:id', async (req, res, next) => {
    try {
      const SQL = ` 
      UPDATE employees
      SET name=$1, department_id=$2, updated_at= now()
      WHERE id=$3 RETURNING *;
      `;
      const response = await client.query(SQL, [req.body.name, 
        req.body.department_id, req.params.id]);
      res.send(response.rows[0]);
    } catch(err) {
        next(err);
    }
});

app.delete('/api/employees/:id', async (req, res, next) => {
    try {
      const SQL = ` 
      DELETE from employees
      WHERE id=$1;
      `;
      const response = await client.query(SQL, [req.params.id]);
      res.sendStatus(204);
    } catch(err) {
        next(err);
    }
});

// error handling route, return error message 
app.use((err, req, res, next) => {
    res.status(500).send({error: err.message});
});

// create your init function
const init = async () => {
    await client.connect();
    let SQL = `  
      DROP TABLE IF EXISTS employees;
      DROP TABLE IF EXISTS departments;

      CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL
      );

      CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES departments(id) NOT NULL
      );
      `;
      await client.query(SQL);
      SQL= `
        INSERT INTO departments(name) VALUES('IT');
        INSERT INTO departments(name) VALUES('HR');
        INSERT INTO departments(name) VALUES('Design');
        INSERT INTO departments(name) VALUES('Marketing');

        INSERT INTO employees(name, department_id) VALUES('Hermoine Granger', 
          (SELECT id FROM departments WHERE name='IT'));
        INSERT INTO employees(name, department_id) VALUES('Ron Weasly', 
          (SELECT id FROM departments WHERE name='IT'));
        INSERT INTO employees(name, department_id) VALUES('Rubeus Hagrid', 
          (SELECT id FROM departments WHERE name='HR'));
        INSERT INTO employees(name, department_id) VALUES('Sirius Black', 
          (SELECT id FROM departments WHERE name='Marketing'));
        INSERT INTO employees(name, department_id) VALUES('Draco Malfoy', 
          (SELECT id FROM departments WHERE name='Marketing')); 
    `;
    console.log('tables created');
    await client.query(SQL);
    console.log('data seeded');
    app.listen(PORT, () => {
      console.log(`Server listening on port ${3000}`);
    })
  };
    
// init function invocation
init();