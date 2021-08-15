import axios from 'axios';

process.on('unhandledRejection', (error) => {
  console.error(error);

  process.exit(1);
});

function parseArguments(args: string[]): {
  tenantId: string;
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  resource: string;
  environment: string;
} {
  let tenantId: string;
  let username: string;
  let password: string;
  let clientId: string;
  let clientSecret: string;
  let scope: string;
  let resource: string;
  let environment: string;

  args.forEach((arg, index) => {
    switch (arg) {
      case '--tenant_id': {
        tenantId = args[index + 1];
      }
      case '--username': {
        username = args[index + 1];
      }
      case '--password': {
        password = args[index + 1];
      }
      case '--client_id': {
        clientId = args[index + 1];
      }
      case '--client_secret': {
        clientSecret = args[index + 1];
      }
      case '--scope': {
        scope = args[index + 1];
      }
      case '--resource': {
        resource = args[index + 1];
      }
      case '--environment': {
        environment = args[index + 1];
      }
      default: {
        break;
      }
    }
  });

  return {
    tenantId,
    username,
    password,
    clientId,
    clientSecret,
    scope,
    resource,
    environment,
  };
}

async function retrieveToken({
  tenantId,
  username,
  password,
  clientId,
  clientSecret,
  scope,
  resource,
}: {
  tenantId: string;
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  resource: string;
}): Promise<string> {
  const { data } = await axios.post<{ access_token: string }>(
    `https://login.windows.net/${tenantId}/oauth2/token`,
    `grant_type=password
    &username=${username}
    &password=${password}
    &client_id=${clientId}
    &client_secret=${clientSecret}
    &scope=${scope}
    &resource=${resource}`,
  );

  return data.access_token;
}

async function getGroupId({
  environment,
  authToken,
}: {
  environment: string;
  authToken: string;
}): Promise<string> {
  const {
    data: { value },
  } = await axios.get<{
    value: {
      name: string;
      id: string;
    }[];
  }>(`https://api.powerbi.com/v1.0/myorg/groups`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  let groupId: string;

  for (const group of value) {
    if (group.name === environment) {
      groupId = group.id;
    }
  }

  if (!groupId) {
    throw new Error(`error_no_group_id`);
  }

  console.log(`get_group_id`, groupId);

  return groupId;
}

(async () => {
  const {
    tenantId,
    username,
    password,
    clientId,
    clientSecret,
    scope,
    resource,
    environment,
  } = parseArguments(process.argv);

  console.log('parsed_args', {
    tenantId,
    username,
    clientId,
    scope,
    resource,
    environment,
  });

  const authToken = await retrieveToken({
    tenantId,
    username,
    password,
    clientId,
    clientSecret,
    scope,
    resource,
  });

  const groupId = await getGroupId({
    environment,
    authToken,
  });

  console.log(`##vso[task.setvariable variable=group_id]${groupId}`);

  process.exit(0);
})();
