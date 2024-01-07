import json

import pendulum
from airflow import DAG
from airflow.providers.amazon.aws.operators.lambda_function import (
    LambdaInvokeFunctionOperator,
)

with DAG(
    dag_id="lambda_dag",
    start_date=pendulum.today("UTC").add(days=-2),
    schedule="@daily",
):
    LambdaInvokeFunctionOperator(
        task_id="lambda_task",
        function_name="mwaa_lambda",
        payload=json.dumps({"date": "{{ ds }}"}),
    )
