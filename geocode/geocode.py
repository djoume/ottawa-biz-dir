from __future__ import print_function
import pickle
import os
import os.path
from dotenv import load_dotenv
from fuzzywuzzy import fuzz
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import googlemaps
import phonenumbers


load_dotenv()


gmaps = googlemaps.Client(key=os.environ['GOOGLE_MAP_API_KEY'])

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

SPREADSHEET_ID = os.environ['SPREADSHEET_ID']
SHEET_RANGE = os.environ['SHEET_RANGE']


def main():
  creds = oauth()

  service = build('sheets', 'v4', credentials=creds)
  sheet = service.spreadsheets()
  result = sheet.values().get(
    spreadsheetId=SPREADSHEET_ID, range=SHEET_RANGE).execute()
  values = result.get('values', [])

  if not values:
    print('No data found.')
    sys.exit(1)

  add_missing_location_data(values)

  result = sheet.values().update(
    spreadsheetId=SPREADSHEET_ID, range=SHEET_RANGE, valueInputOption='RAW',
    body={'values': values}).execute()
  print('{0} cells updated.'.format(result.get('updatedCells')))


def oauth():
  creds = None
  # The file token.pickle stores the user's access and refresh tokens, and is
  # created automatically when the authorization flow completes for the first
  # time.
  if os.path.exists('token.pickle'):
    with open('token.pickle', 'rb') as token:
      creds = pickle.load(token)
  # If there are no (valid) credentials available, let the user log in.
  if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
      creds.refresh(Request())
    else:
      flow = InstalledAppFlow.from_client_secrets_file(
        'credentials.json', SCOPES)
      creds = flow.run_local_server(port=0)
    # Save the credentials for the next run
    with open('token.pickle', 'wb') as token:
      pickle.dump(creds, token)

  return creds


def add_missing_location_data(values):
  ADDRESS = 1
  PHONE = 4
  LATITUDE = 10
  LONGITUDE = 11
  CATEGORY = 12
  ICON = 13

  for row in values:
    while len(row) < 14:
      row.append('')
    if row[PHONE] and not row[LATITUDE]:
      try:
        number = phonenumbers.parse(row[PHONE], 'CA')
      except phonenumbers.phonenumberutil.NumberParseException:
        print('{0} did not seem to be as phone number, skipping'.format(row[PHONE]))
        continue

      number_formatted = phonenumbers.format_number(
        number, phonenumbers.PhoneNumberFormat.E164)
      result = gmaps.find_place(number_formatted, 'phonenumber', ['formatted_address', 'types', 'geometry', 'icon'])
      if result.get('status') == 'OK':
        if len(result['candidates']) > 1:
          def addr_compare(candidate):
              return fuzz.ratio(row[ADDRESS], candidate['formatted_address'])

          result['candidates'] = sorted(result['candidates'], reverse=True, key=addr_compare)

        row[LATITUDE] = result['candidates'][0]['geometry']['location']['lat']
        row[LONGITUDE] = result['candidates'][0]['geometry']['location']['lng']
        row[CATEGORY] = ', '.join(result['candidates'][0]['types'])
        row[ICON] = result['candidates'][0]['icon']

    print(row)
  return values


if __name__ == '__main__':
  main()
