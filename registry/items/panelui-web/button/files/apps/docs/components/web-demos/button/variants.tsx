import { Button } from 'panelui-web/button';

export default function ButtonVariants() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button>Publish</Button>
      <Button variant="secondary">Save draft</Button>
      <Button variant="outline">Preview</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="link">Learn more</Button>
    </div>
  );
}
