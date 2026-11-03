#!/usr/bin/env python3
"""Run on the owner's server; secrets are read/written there and never printed.

Creates a dedicated Colors OIDC client and owner-only group, leaving Heuristica
and its groups unchanged. Existing unexpected configuration fails closed.
"""
import argparse
import json
import os
from pathlib import Path
import urllib.error
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--owner', required=True, help='Existing Pocket ID username')
parser.add_argument('--origin', default='https://colors.arturtrifonov.com')
args = parser.parse_args()
if args.origin != 'https://colors.arturtrifonov.com':
    raise SystemExit('Review the callback and deployment configuration before changing origin')

def env(path):
    result = {}
    if not path.exists():
        return result
    for line in path.read_text().splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key, value = line.split('=', 1)
            result[key.strip()] = value.strip().strip('"').strip("'")
    return result

key = env(Path('/srv/pocket-id/.env')).get('STATIC_API_KEY')
if not key:
    raise SystemExit('The existing Pocket ID provisioning key is unavailable')

def api(method, route, payload=None):
    headers = {'X-API-KEY': key}
    data = None
    if payload is not None:
        headers['Content-Type'] = 'application/json'
        data = json.dumps(payload).encode()
    request = urllib.request.Request('http://127.0.0.1:1411/api/' + route, method=method, headers=headers, data=data)
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            content = response.read()
            return json.loads(content) if content else None
    except urllib.error.HTTPError as error:
        raise SystemExit(f'Pocket ID rejected {method} {route}: HTTP {error.code}') from None

def items(route):
    response = api('GET', route + '?pagination[limit]=100')
    return response.get('data', []) if isinstance(response, dict) else response

users = [user for user in items('users') if user['username'] == args.owner and not user.get('disabled')]
if len(users) != 1 or users[0]['id'] == '00000000-0000-0000-0000-000000000000':
    raise SystemExit('Choose one existing, enabled human owner account')
owner = users[0]['id']
groups = [group for group in items('user-groups') if group['name'] == 'stylos-colors-editors']
if len(groups) > 1:
    raise SystemExit('Ambiguous Colors group')
group = groups[0] if groups else api('POST', 'user-groups', {'name': 'stylos-colors-editors', 'friendlyName': 'Stylos Colors editors'})
group_id = group['id']
details = api('GET', 'user-groups/' + group_id)
members = {user['id'] for user in details.get('users', [])}
if members - {owner}:
    raise SystemExit('The Colors group contains other accounts; leaving it unchanged')
if members != {owner}:
    api('PUT', 'user-groups/' + group_id + '/users', {'userIds': [owner]})

clients = [client for client in items('oidc/clients') if client['name'] == 'Stylos Colors']
if len(clients) > 1:
    raise SystemExit('Ambiguous Colors OIDC client')
output = Path('/home/deploy/stylos-colors/.env')
previous = env(output)
if clients:
    client = clients[0]
    if previous.get('OIDC_CLIENT_ID') != client['id'] or not previous.get('OIDC_CLIENT_SECRET'):
        raise SystemExit('An existing Colors client has no matching server credentials; refusing to rotate it')
    secret = previous['OIDC_CLIENT_SECRET']
else:
    client = api('POST', 'oidc/clients', {'name': 'Stylos Colors', 'callbackURLs': [args.origin + '/auth/callback'],
        'logoutCallbackURLs': [], 'launchURL': args.origin, 'isPublic': False, 'isGroupRestricted': True, 'pkceEnabled': True})
    secret = client.get('clientSecret') or client.get('createdSecret', {}).get('secret')
    if not secret:
        raise SystemExit('The new client did not return credentials; do not deploy until this is resolved')

values = {'COLORS_ORIGIN': args.origin, 'OIDC_ISSUER': 'https://id.arturtrifonov.com', 'OIDC_CLIENT_ID': client['id'],
          'OIDC_CLIENT_SECRET': secret, 'COLORS_EDITOR_SUBJECTS': owner}
if any('\n' in value or '\r' in value or '$' in value for value in values.values()):
    raise SystemExit('Unexpected characters in server configuration')
temporary = output.with_name('.env.pending')
fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, 'w') as stream:
    stream.write(''.join(name + '=' + value + '\n' for name, value in values.items()))
    stream.flush()
    os.fsync(stream.fileno())
os.chmod(temporary, 0o600)
temporary.replace(output)
if client.get('callbackURLs') != [args.origin + '/auth/callback'] or client.get('isPublic') or not client.get('pkceEnabled'):
    raise SystemExit('Unexpected existing client configuration; credentials saved, but deployment stopped')
api('PUT', 'oidc/clients/' + client['id'] + '/allowed-user-groups', {'userGroupIds': [group_id]})
verified = api('GET', 'oidc/clients/' + client['id'])
if not verified.get('isGroupRestricted') or {group['id'] for group in verified.get('allowedUserGroups', [])} != {group_id}:
    raise SystemExit('Pocket ID did not confirm the owner-only restriction')
print(json.dumps({'client': client['id'], 'owner': args.owner, 'group': 'stylos-colors-editors', 'callback': args.origin + '/auth/callback', 'credentials': 'saved on server, mode 0600'}))
