import { Select } from 'panelui-web/select';

const ZONES = {
  Europe: [
    { value: 'Europe/Lisbon', label: 'Lisbon' },
    { value: 'Europe/Berlin', label: 'Berlin' },
    { value: 'Europe/Helsinki', label: 'Helsinki' },
  ],
  Americas: [
    { value: 'America/Bogota', label: 'Bogotá' },
    { value: 'America/Toronto', label: 'Toronto' },
    { value: 'America/Vancouver', label: 'Vancouver' },
  ],
  Asia: [
    { value: 'Asia/Dubai', label: 'Dubai' },
    { value: 'Asia/Singapore', label: 'Singapore' },
    { value: 'Asia/Seoul', label: 'Seoul' },
  ],
};

const ITEMS = Object.values(ZONES).flat();

export default function SelectGrouped() {
  return (
    <div className="w-full max-w-xs">
      <Select items={ITEMS}>
        <Select.Trigger aria-label="Time zone">
          <Select.Value placeholder="Choose a time zone" />
        </Select.Trigger>
        <Select.Content>
          {Object.entries(ZONES).map(([region, zones], index) => (
            <Select.Group key={region}>
              {index > 0 ? <Select.Separator /> : null}
              <Select.GroupLabel>{region}</Select.GroupLabel>
              {zones.map((zone) => (
                <Select.Item key={zone.value} value={zone.value}>
                  {zone.label}
                </Select.Item>
              ))}
            </Select.Group>
          ))}
        </Select.Content>
      </Select>
    </div>
  );
}
