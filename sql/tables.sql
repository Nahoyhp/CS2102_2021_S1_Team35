CREATE TABLE users (
email VARCHAR PRIMARY KEY,
name VARCHAR NOT NULL,
role VARCHAR NOT NULL,
password VARCHAR NOT NULL CHECK (LENGTH(password) >= 8)
);

CREATE TABLE pcsadmins (
email VARCHAR PRIMARY KEY,
FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
);

CREATE TABLE petowners (
email VARCHAR PRIMARY KEY,
credit_card VARCHAR(19) CHECK (LENGTH(credit_card) >= 10),
address VARCHAR NOT NULL,
postal_code VARCHAR(6) NOT NULL CHECK (LENGTH(postal_code) = 6),
FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
);

CREATE TABLE caretakers (
email VARCHAR PRIMARY KEY,
address VARCHAR NOT NULL,
postal_code VARCHAR(6) NOT NULL CHECK (LENGTH(postal_code) = 6),
current_rating NUMERIC(2, 1) CHECK (current_rating >= 1 AND current_rating <= 5),
FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
);

CREATE TABLE fulltimers (
email VARCHAR PRIMARY KEY REFERENCES caretakers(email) ON DELETE CASCADE
);

CREATE TABLE parttimers (
email VARCHAR PRIMARY KEY REFERENCES caretakers(email) ON DELETE CASCADE,
pet_limit INTEGER NOT NULL CHECK (pet_limit >= 2 AND pet_limit <= 5)
);

CREATE TABLE ownedpets (
name VARCHAR NOT NULL,
email VARCHAR NOT NULL REFERENCES petowners(email) ON DELETE CASCADE,
category VARCHAR NOT NULL,
special_needs VARCHAR,
PRIMARY KEY (name, email)
);

CREATE table availability (
email VARCHAR NOT NULL REFERENCES caretakers(email) ON DELETE CASCADE,
available_daterange DATERANGE NOT NULL,
PRIMARY KEY (email, available_daterange)
);

CREATE table services (
category VARCHAR PRIMARY KEY,
base_price NUMERIC NOT NULL
);

CREATE table provides (
email VARCHAR NOT NULL REFERENCES caretakers(email),
category VARCHAR NOT NULL REFERENCES services(category),
price NUMERIC NOT NULL,
PRIMARY KEY (email, category)
);

CREATE table bids (
oemail VARCHAR NOT NULL,
pname VARCHAR NOT NULL,
cemail VARCHAR NOT NULL REFERENCES caretakers(email),
service_daterange DATERANGE NOT NULL,
total_cost NUMERIC NOT NULL,
transfer_mode VARCHAR NOT NULL,
payment_mode VARCHAR NOT NULL,
rating NUMERIC(2, 1) CHECK (rating >= 1 AND rating <= 5),
review VARCHAR,
successful BOOLEAN,
FOREIGN KEY (oemail, pname) REFERENCES ownedpets(email, name),
PRIMARY KEY (oemail, pname, cemail, service_daterange)
);

CREATE table records (
email VARCHAR NOT NULL REFERENCES caretakers(email),
month DATERANGE NOT NULL,
salary NUMERIC NOT NULL,
total_pets INTEGER NOT NULL DEFAULT 0,
pet_day INTEGER,
PRIMARY KEY (email, month)
);