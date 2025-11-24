# HA Thermostat

A custom Home Assistant integration that controls climate entities based on a schedule.

## Features

- **Schedule-based control**: Define schedules for your climate entities.
- **Flexible assignment**: Assign schedules to one or multiple climate entities.
- **Easy setup**: Configure schedules easily (details TBD).

## Installation

### HACS

1. Open HACS in Home Assistant.
2. Go to "Integrations".
3. Click the three dots in the top right corner and select "Custom repositories".
4. Add `https://github.com/jeffreyvangorkum/ha-thermostat` as an "Integration".
5. Search for "HA Thermostat" and install it.
6. Restart Home Assistant.

## Configuration

## Lovelace Card

This integration comes with a custom Lovelace card.

### Installation

1. After installing the integration via HACS, the card resource should be automatically added. If not, add `/ha_thermostat/ha-thermostat-card.js` as a JavaScript Module to your Lovelace resources.

### Configuration

Add the following to your dashboard configuration:

```yaml
type: custom:ha-thermostat-card
```

There are currently no additional configuration options. The card will automatically display all available climate entities.

## Credits

This integration was created with the assistance of [Antigravity](https://deepmind.google/technologies/gemini/).
