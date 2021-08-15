import axios from 'axios';

export async function setScheduledRefreshDetails({
  authToken,
  groupId,
  datasetId,
  body,
}: {
  authToken: string;
  groupId: string;
  datasetId: string;
  body: {
    days: string[];
    enabled: boolean;
    times: string[];
    localTimeZoneId: string;
  };
}) {
  await axios.patch(
    `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/datasets/${datasetId}/refreshSchedule`,
    body,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  );
}
