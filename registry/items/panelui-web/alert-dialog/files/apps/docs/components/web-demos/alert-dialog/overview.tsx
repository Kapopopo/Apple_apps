'use client';

import { AlertDialog } from 'panelui-web/alert-dialog';
import { Button } from 'panelui-web/button';

export default function AlertDialogOverview() {
  return (
    <AlertDialog>
      <AlertDialog.Trigger render={<Button variant="destructive" />}>Delete project</AlertDialog.Trigger>
      <AlertDialog.Content tone="destructive">
        <AlertDialog.Title>Delete Orchard?</AlertDialog.Title>
        <AlertDialog.Description>
          Its 14 boards and their history are deleted with it. This cannot be undone.
        </AlertDialog.Description>
        <AlertDialog.Footer>
          <AlertDialog.Cancel />
          <AlertDialog.Action>Delete project</AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
}
