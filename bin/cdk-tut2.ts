#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkTut2Stack } from '../lib/cdk-tut2-stack';
import { DmsStack } from '../lib/dms-stack';
// import { DataLakeStack } from '../lib/stacks/datalake-stack';
// import { DataLakeEnrollment } from '../lib/constructs/data-lake-enrollment';


const app = new cdk.App();
// new CdkTut2Stack(app, 'CdkTut2Stack', {
 
// });

new DmsStack(app, 'DmsStack', {
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});

// const coreDataLake = new DataLakeStack(app, 'CoreDataLake', {
//   description: "AWS Data Lake as Code core data lake template."
// });


// var exampleGrant: DataLakeEnrollment.TablePermissionGrant = {
//     tables: ["association_data", "evidence_data","target_list","disease_list"],
//     DatabasePermissions: [DataLakeEnrollment.DatabasePermission.Alter, DataLakeEnrollment.DatabasePermission.CreateTable, DataLakeEnrollment.DatabasePermission.Drop],
//     GrantableDatabasePermissions: [DataLakeEnrollment.DatabasePermission.Alter, DataLakeEnrollment.DatabasePermission.CreateTable, DataLakeEnrollment.DatabasePermission.Drop],
//     TablePermissions: [DataLakeEnrollment.TablePermission.Select, DataLakeEnrollment.TablePermission.Insert, DataLakeEnrollment.TablePermission.Delete],
//     GrantableTablePermissions: [DataLakeEnrollment.TablePermission.Select]
// };