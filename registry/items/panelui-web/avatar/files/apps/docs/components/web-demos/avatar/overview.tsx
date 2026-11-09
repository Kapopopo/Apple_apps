import { Avatar } from 'panelui-web/avatar';

const ME = 'https://avatars.githubusercontent.com/u/127331761?v=4';

export default function AvatarOverview() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      <Avatar src={ME} name="Khalid Abdi" size="xl">
        <Avatar.Badge status="online" />
      </Avatar>
      <Avatar name="Noor Haddad" size="xl" />
      <Avatar name="Harbour Works" shape="square" size="xl" />
      <Avatar.Group size="lg" max={4} label="Editors">
        <Avatar src={ME} name="Khalid Abdi" />
        <Avatar name="Ines Duarte" />
        <Avatar name="Kofi Mensah" />
        <Avatar name="Yuki Tanabe" />
        <Avatar name="Ravi Patel" />
        <Avatar name="Selma Berg" />
      </Avatar.Group>
    </div>
  );
}
