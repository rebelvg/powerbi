import axios from 'axios';

export async function setScheduledRefreshDetails({
  authToken,
  groupId,
  datasetId,
}: {
  authToken: string;
  groupId: string;
  datasetId: string;
}) {
  await axios.patch(
    `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/datasets/${datasetId}/refreshSchedule`,
    {
      days: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      enabled: true,
      times: ['06:00', '09:00', '12:00', '16:00', '18:00'],
      localTimeZoneId: 'Pacific Standard Time',
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  );
}
