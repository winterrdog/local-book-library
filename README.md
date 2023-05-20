# local-book-library
Local book Library website written in Express (Node)

# little background info
i wrote this project as a lesson to learn a lot more mongoDB and express.js( plus node.js at large :) )

# usage
- navigate to the root of the repository.
- install all necessary dependencies:
    ```sh
    npm install
    ```
- create a `.env` file and input the following:
    ```
    DB_PASSWD=<your_db_password>
    DB_USER=<your_db_username>
    ```
- run in `prod` mode:
    ```sh
    npm run start
    ```
- run in `debug` mode:
    ```sh
    npm run devStart
    ```