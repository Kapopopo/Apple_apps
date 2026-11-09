'use client';

import { Alert } from 'panelui-web/alert';

export default function AlertOverview() {
  return (
    <Alert tone="info" className="w-full max-w-md">
      <Alert.Icon />
      <Alert.Title>Two-step sign-in starts on 1 December</Alert.Title>
      <Alert.Description>After their password, everyone in the workspace will be asked for a code from their phone.</Alert.Description>
    </Alert>
  );
}
