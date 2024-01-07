#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { MwaaAirflowStack } from "../lib/mwaa-airflow-stack";

const app = new App();
new MwaaAirflowStack(app, "MwaaAirflowStack");
