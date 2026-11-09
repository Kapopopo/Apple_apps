import unittest
from server import registry_index, validate_spec


class SpecValidationTests(unittest.TestCase):
    def setUp(self):
        items = registry_index()['items']
        if not items:
            self.skipTest('Registre vide : lancer npm run import')
        self.block = next(i['id'] for i in items if i['type'] == 'component')
        self.theme = next(i['id'] for i in items if i['type'] == 'theme')
        self.font = next(i['id'] for i in items if i['type'] == 'font')

    def test_valid_spec_is_normalized(self):
        spec = validate_spec(dict(name='dashboard-padel', theme=self.theme, fonts=[self.font, self.font], blocks=[dict(id=self.block, note='Hero')]))
        self.assertEqual(spec['fonts'], [self.font])
        self.assertEqual(spec['blocks'], [dict(id=self.block, note='Hero')])
        self.assertFalse(spec['preset'])
        self.assertEqual(spec['brief'], '')

    def test_rejections(self):
        cases = [
            dict(name='Dashboard Padel'),
            dict(name='../etc'),
            dict(name='ok', theme=self.block),
            dict(name='ok', fonts=[self.theme]),
            dict(name='ok', blocks=[dict(id='inconnu/x')]),
            dict(name='ok', blocks=[dict(id=self.block, note='x' * 2001)]),
            dict(name='ok', blocks=[dict(id=self.block, extra=1)]),
            dict(name='ok', script='alert(1)'),
            'pas un objet',
        ]
        for raw in cases:
            with self.assertRaises(ValueError, msg=repr(raw)[:80]):
                validate_spec(raw)


if __name__ == '__main__':
    unittest.main()
