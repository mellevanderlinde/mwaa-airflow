#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { MwaaStack } from "../lib/mwaa-stack";
import { DagStack } from "../lib/dag-stack";

const app = new App();

const mwaaStack = new MwaaStack(app, "MwaaStack");

new DagStack(app, "DagStack", {
  bucketName: mwaaStack.bucketName,
  dagFolder: mwaaStack.dagFolder,
  roleName: mwaaStack.roleName,
});
