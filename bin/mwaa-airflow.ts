#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MwaaAirflowStack } from "../lib/mwaa-airflow-stack";

const app = new cdk.App();
new MwaaAirflowStack(app, "MwaaAirflowStack");
