'use client';

import { Button } from 'panelui-web/button';
import { Dialog } from 'panelui-web/dialog';
import { Input } from 'panelui-web/input';
import { Label } from 'panelui-web/label';
import { useState } from 'react';

export default function DialogOverview() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Spring launch');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={<Button variant="outline" />}>Rename board</Dialog.Trigger>
      <Dialog.Content size="sm">
        <Dialog.Header title="Rename board" description="Everyone on the board will see it." />
        <Dialog.Body>
          <form
            id="rename-board"
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const next = new FormData(event.currentTarget).get('name');
              if (typeof next === 'string' && next.trim()) setName(next.trim());
              setOpen(false);
            }}
          >
            <Label htmlFor="board-name">
              <Label.Text>Name</Label.Text>
            </Label>
            <Input id="board-name" name="name" defaultValue={name} autoComplete="off" />
          </form>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close render={<Button variant="secondary" />}>Cancel</Dialog.Close>
          <Button type="submit" form="rename-board">
            Save
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
