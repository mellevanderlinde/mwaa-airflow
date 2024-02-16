#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { MwaaAirflowStack } from "../lib/mwaa-airflow-stack";
import { DagAirflowStack } from "../lib/dag-airflow-stack";

const app = new App();

const mwaaAirflowStack = new MwaaAirflowStack(app, "MwaaAirflowStack");

new DagAirflowStack(app, "DagAirflowStack", {
  bucketName: mwaaAirflowStack.bucketName,
  dagFolder: mwaaAirflowStack.dagFolder,
  roleName: mwaaAirflowStack.roleName,
});
