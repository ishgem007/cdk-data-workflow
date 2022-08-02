import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
// import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_dynamodb as dynamodb } from  'aws-cdk-lib';
import { aws_rds as rds,  } from  'aws-cdk-lib';
import { aws_ec2 as ec2  } from  'aws-cdk-lib';
import { Vpc as vpc } from 'aws-cdk-lib/aws-ec2';
import { aws_dms as dms } from 'aws-cdk-lib';
import * as glue_alpha from '@aws-cdk/aws-glue-alpha';
import * as glue from "@aws-cdk/aws-glue";
import { Job } from '@aws-cdk/aws-glue'
import { CfnCrawlerProps } from '@aws-cdk/aws-glue'
import { Asset } from "@aws-cdk/aws-s3-assets";
import {
  Role,
  ManagedPolicy,
  ServicePrincipal,
  Policy,
  PolicyStatement,
  Effect,
} from "@aws-cdk/aws-iam";
import * as path from "path";

export class CdkTut2Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

   
   

    // use the Bucket construct
    const bucket2 = new s3.Bucket(this, 'data-bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    //DynamoBD
    const table = new dynamodb.Table(this, 'Table-db', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });




    // create the VPC
    const vpc = new ec2.Vpc(this, 'my-cdk-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'isolated-subnet-1',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        },
      ],
    });

    //  create a security group for the EC2 instance
    const ec2InstanceSG = new ec2.SecurityGroup(this, 'ec2-instance-sg', {
      vpc,
    });

    ec2InstanceSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'allow SSH connections from anywhere',
    );

    // create the EC2 instance
    const ec2Instance = new ec2.Instance(this, 'ec2-instance', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: ec2InstanceSG,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyName: 'ec2-key-pair',
    });



  
    //  create RDS instance
    const dbInstance = new rds.DatabaseInstance(this, 'db-instance', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13_1,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO,
      ),
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      multiAz: false,
      allocatedStorage: 100,
      maxAllocatedStorage: 105,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(0),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      databaseName: 'dotdata',
      publiclyAccessible: false,
    });

    dbInstance.connections.allowFrom(ec2Instance, ec2.Port.tcp(5432));

    new cdk.CfnOutput(this, 'dbEndpoint', {
      value: dbInstance.instanceEndpoint.hostname,
    });

    

    new cdk.CfnOutput(this, 'secretName', {
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      value: dbInstance.secret?.secretName!,
    });


    // SOURCE ENDPOINT FOR dms
    const Postgre_target =  new cdk.CfnOutput(this, 'dbEndpoint1', {
      value: dbInstance.instanceEndpoint.hostname,
    });


    //AWS DMS
   
    // const cfnReplicationTask = new dms.CfnReplicationTask(this, 'MyCfnReplicationTask', {
    //   migrationType: 'migrationType',
    //   replicationInstanceArn: 'replicationInstanceArn',
    //   sourceEndpointArn: `${Postgre_target}`, //'sourceEndpointArn', //--postgre-sql-settings file:///your-file-path/my_postgresql_settings.json
    //   tableMappings: 'tableMappings',
    //   targetEndpointArn: 'targetEndpointArn',

    //   // the properties below are optional
    //   cdcStartPosition: 'cdcStartPosition',
    //   cdcStartTime: 123,
    //   cdcStopPosition: 'cdcStopPosition',
    //   replicationTaskIdentifier: 'replicationTaskIdentifier',
    //   replicationTaskSettings: 'replicationTaskSettings',
    //   resourceIdentifier: 'resourceIdentifier',
    //   tags: [{
    //     key: 'key',
    //     value: 'value',
    //   }],
    //   taskData: 'taskData',
    // });



    //AWS DMS 2
    
// Create a subnet group that allows DMS to access your data
// const subnet = new dms.CfnReplicationSubnetGroup(this, 'SubnetGroup', {
//   replicationSubnetGroupIdentifier: 'cdk-subnetgroup',
//   replicationSubnetGroupDescription: 'Subnets that have access to my data source and target.',
//   subnetIds: [ ec2Instance.instanceId, 'subnet-456' ],
// });

// Launch an instance in the subnet group
// const instance = new dms.CfnReplicationInstance(this, 'Instance', {
//   replicationInstanceIdentifier: 'cdk-instance',

//   // Use the appropriate instance class: https://docs.aws.amazon.com/dms/latest/userguide/CHAP_ReplicationInstance.Types.html
//   replicationInstanceClass: 'dms.t2.small',

//   // Setup networking
//   replicationSubnetGroupIdentifier: subnet.replicationSubnetGroupIdentifier,
//   vpcSecurityGroupIds: [ 'sg-123' ],
// });

// Create endpoints for your data, see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-dms-endpoint.html
// const source = new dms.CfnEndpoint(this, 'Source', {
//   endpointIdentifier: dbInstance.instanceArn,
//   endpointType: dbInstance.dbInstanceEndpointAddress,
//   engineName: 'postgres',

//   serverName: dbInstance.dbInstanceEndpointAddress,
//   port: 5432,
//   databaseName: 'dotdata',
//   username: 'dms-user',
//   password: 'password-from-secret',
// });

// const target = new dms.CfnEndpoint(this, 'Target', {
//   endpointIdentifier: bucket2.bucketArn,
//   endpointType: bucket2.bucketName,
//   engineName: 's3',

//   s3Settings: {
//     bucketName: 'bucket2'
//   },
// });

// Define the replication task
const task = new dms.CfnReplicationTask(this, 'Task', {
  replicationInstanceArn: dbInstance.instanceArn,

  migrationType: 'full-load', // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-dms-replicationtask.html#cfn-dms-replicationtask-migrationtype
  sourceEndpointArn: dbInstance.instanceArn,
  targetEndpointArn: bucket2.bucketArn,
  tableMappings: JSON.stringify({
    "rules": [{
      "rule-type": "selection",
      "rule-id": "1",
      "rule-name": "1",
      "object-locator": {
        "schema-name": "%",
        "table-name": "%"
      },
      "rule-action": "include"
    }]
  })
})

//GLUE FLOW

const RefinedDatabase = new glue_alpha.Database(this, 'RefinedDatabase', {
  databaseName: 'my_database',
});

const securityGroup =  cdk.aws_ec2.SecurityGroup;
const subnet = ec2.Subnet;
new glue_alpha.Connection( this, 'MyConnection', {
  type: glue_alpha.ConnectionType.NETWORK,
  // The security groups granting AWS Glue inbound access to the data source within the VPC
  // securityGroups: [ securityGroup ],
  // The VPC subnet which contains the data source
  //subnet,
});


const bucketdata = bucket2;
const JobProps = new glue_alpha.Job(this, 'PythonShellJob', {
  executable: glue_alpha.JobExecutable.pythonShell({
    glueVersion: glue_alpha.GlueVersion.V1_0,
    pythonVersion: glue_alpha.PythonVersion.THREE,
    script: glue_alpha.Code.fromBucket(bucketdata, 'script.py'),
  }),
  description: 'an example Python Shell job',
});
 
// new Job(this,'Datajob', JobProps)

const cfnCrawlerProps: glue.CfnCrawlerProps = {
  role: 'role',
  targets: {
    catalogTargets: [{
      databaseName: `${RefinedDatabase}`,
      tables: ['tables'],
    }],
    dynamoDbTargets: [{
      path: 'path',
    }],
    jdbcTargets: [{
      connectionName: 'connectionName',
      exclusions: ['exclusions'],
      path: 'path',
    }],
    mongoDbTargets: [{
      connectionName: 'connectionName',
      path: 'path',
    }],
    s3Targets: [{
      connectionName: 'connectionName',
      dlqEventQueueArn: 'dlqEventQueueArn',
      eventQueueArn: 'eventQueueArn',
      exclusions: ['exclusions'],
      path: 'path',
      sampleSize: 123,
    }],
  },

  // the properties below are optional
  classifiers: ['classifiers'],
  configuration: 'configuration',
  crawlerSecurityConfiguration: 'crawlerSecurityConfiguration',
  databaseName: 'databaseName',
  description: 'description',
  name: 'name',
  recrawlPolicy: {
    recrawlBehavior: 'recrawlBehavior',
  },
  schedule: {
    scheduleExpression: 'scheduleExpression',
  },
  schemaChangePolicy: {
    deleteBehavior: 'deleteBehavior',
    updateBehavior: 'updateBehavior',
  },
  tablePrefix: 'tablePrefix',
  // tags: tags,
};


  
  }
}




