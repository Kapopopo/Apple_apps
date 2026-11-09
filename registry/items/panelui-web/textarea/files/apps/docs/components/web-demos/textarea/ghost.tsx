import { Button } from 'panelui-web/button';
import { Card } from 'panelui-web/card';
import { Textarea } from 'panelui-web/textarea';

export default function TextareaGhost() {
  return (
    <Card size="sm" className="w-full max-w-md">
      <Card.Header>
        <Card.Title>Leave a note</Card.Title>
        <Card.Description>Only people on this project can see it.</Card.Description>
      </Card.Header>
      <Card.Content>
        <Textarea variant="ghost" minRows={3} placeholder="Write something for the team" aria-label="Note" />
      </Card.Content>
      <Card.Footer variant="panel" className="justify-end">
        <Button size="sm" variant="ghost">
          Discard
        </Button>
        <Button size="sm">Post note</Button>
      </Card.Footer>
    </Card>
  );
}
