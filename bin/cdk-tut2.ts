#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkTut2Stack } from '../lib/cdk-tut2-stack';
import { DataLakeStack } from '../lib/stacks/datalake-stack';
import { DataLakeEnrollment } from '../lib/constructs/data-lake-enrollment';


const app = new cdk.App();
new CdkTut2Stack(app, 'CdkTut2Stack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

const coreDataLake = new DataLakeStack(app, 'CoreDataLake', {
  description: "AWS Data Lake as Code core data lake template."
});


var exampleGrant: DataLakeEnrollment.TablePermissionGrant = {
    tables: ["association_data", "evidence_data","target_list","disease_list"],
    DatabasePermissions: [DataLakeEnrollment.DatabasePermission.Alter, DataLakeEnrollment.DatabasePermission.CreateTable, DataLakeEnrollment.DatabasePermission.Drop],
    GrantableDatabasePermissions: [DataLakeEnrollment.DatabasePermission.Alter, DataLakeEnrollment.DatabasePermission.CreateTable, DataLakeEnrollment.DatabasePermission.Drop],
    TablePermissions: [DataLakeEnrollment.TablePermission.Select, DataLakeEnrollment.TablePermission.Insert, DataLakeEnrollment.TablePermission.Delete],
    GrantableTablePermissions: [DataLakeEnrollment.TablePermission.Select]
};