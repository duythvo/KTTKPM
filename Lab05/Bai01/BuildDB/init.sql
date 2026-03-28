CREATE TABLE IF NOT EXISTS students (
	id SERIAL PRIMARY KEY,
	full_name VARCHAR(100) NOT NULL,
	email VARCHAR(150) UNIQUE NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO students (full_name, email)
VALUES
	('Nguyen Van A', 'a@example.com'),
	('Tran Thi B', 'b@example.com'),
	('Le Van C', 'c@example.com');