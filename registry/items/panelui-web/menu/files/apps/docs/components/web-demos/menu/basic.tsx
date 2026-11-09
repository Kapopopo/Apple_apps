import { Button } from 'panelui-web/button';
import { Menu } from 'panelui-web/menu';

export default function MenuBasic() {
  return (
    <Menu>
      <Menu.Trigger render={<Button variant="outline" />}>Open</Menu.Trigger>
      <Menu.Content>
        <Menu.Item>Open in new tab</Menu.Item>
        <Menu.Item>Copy link</Menu.Item>
        <Menu.Item>Move to folder</Menu.Item>
      </Menu.Content>
    </Menu>
  );
}
