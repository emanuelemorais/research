-- =========================
-- Table: EducationLevels
-- =========================
CREATE TABLE EducationLevels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

INSERT INTO EducationLevels (name) VALUES ('High School');
INSERT INTO EducationLevels (name) VALUES ('Undergraduate (Incomplete)');
INSERT INTO EducationLevels (name) VALUES ('Undergraduate (Complete)');
INSERT INTO EducationLevels (name) VALUES ('Postgraduate +');


-- =========================
-- Table: BlockchainKnowledgeLevels
-- =========================
CREATE TABLE BlockchainKnowledgeLevels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

INSERT INTO BlockchainKnowledgeLevels (name) VALUES ('Beginner');
INSERT INTO BlockchainKnowledgeLevels (name) VALUES ('Intermediate');
INSERT INTO BlockchainKnowledgeLevels (name) VALUES ('Advanced');


-- =========================
-- Table: Users
-- =========================
CREATE TABLE Users (
  id SERIAL PRIMARY KEY,
  educationLevelId INT NOT NULL,
  blockchainKnowledgeLevelId INT NOT NULL,
  age VARCHAR(255) UNIQUE NOT NULL,
  FOREIGN KEY (educationLevelId) REFERENCES EducationLevels(id) ON DELETE CASCADE,
  FOREIGN KEY (blockchainKnowledgeLevelId) REFERENCES BlockchainKnowledgeLevels(id) ON DELETE CASCADE
);


-- =========================
-- Table: Platforms
-- =========================
CREATE TABLE Platforms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

INSERT INTO Platforms (name) VALUES ('With Usability');
INSERT INTO Platforms (name) VALUES ('No Usability');


-- =========================
-- Table: Sessions
-- =========================
CREATE TABLE Sessions (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL,
  platformId INT NOT NULL,
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (platformId) REFERENCES Platforms(id) ON DELETE CASCADE
);


-- =========================
-- Table: Tasks
-- =========================
CREATE TABLE Tasks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO Tasks (name) VALUES ('Login');
INSERT INTO Tasks (name) VALUES ('Deposit');
INSERT INTO Tasks (name) VALUES ('Withdraw');
INSERT INTO Tasks (name) VALUES ('Swap');
INSERT INTO Tasks (name) VALUES ('Transfer');


-- =========================
-- Table: TasksCompleted
-- =========================
CREATE TABLE TasksCompleted (
  id SERIAL PRIMARY KEY,
  taskId INT NOT NULL,
  sessionId INT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (taskId) REFERENCES Tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (sessionId) REFERENCES Sessions(id) ON DELETE CASCADE
);


-- =========================
-- Table: Buttons
-- =========================
CREATE TABLE Buttons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO Buttons (name) VALUES ('Login');
INSERT INTO Buttons (name) VALUES ('Deposit');
INSERT INTO Buttons (name) VALUES ('Withdraw');
INSERT INTO Buttons (name) VALUES ('Swap');
INSERT INTO Buttons (name) VALUES ('Transfer');
INSERT INTO Buttons (name) VALUES ('Logout');


-- =========================
-- Table: ButtonClicks
-- =========================
CREATE TABLE ButtonClicks (
  id SERIAL PRIMARY KEY,
  buttonId INT NOT NULL,
  sessionId INT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (buttonId) REFERENCES Buttons(id) ON DELETE CASCADE,
  FOREIGN KEY (sessionId) REFERENCES Sessions(id) ON DELETE CASCADE
);