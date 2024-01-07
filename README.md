# Apache Airflow on AWS

This project creates an MWAA (Amazon Managed Workflows for Apache Airflow) environment and a DAG that runs a Lambda function. Keep in mind that MWAA can be a costly service, and that these security configurations may not be suitable for a production setup.

## Deploy

To install the project's dependencies and deploy to AWS, run the following:

```
npm install
npm run cdk deploy 
```
