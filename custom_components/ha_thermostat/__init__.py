"""The HA Thermostat integration."""
from __future__ import annotations

from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import DOMAIN

# List the platforms that you want to support.
# For your thermostat, you definitely need CLIMATE.
PLATFORMS: list[Platform] = [Platform.CLIMATE]


import logging

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up HA Thermostat from a config entry."""
    _LOGGER.info("Setting up HA Thermostat integration")

    hass.data.setdefault(DOMAIN, {})
    # TODO: Store any global data in hass.data[DOMAIN] if needed.

    # Register the Lovelace card
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            "/ha_thermostat/ha-thermostat-card.js",
            hass.config.path("custom_components/ha_thermostat/www/ha-thermostat-card.js"),
            True,
        )
    ])

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        # TODO: Clean up any data stored in hass.data[DOMAIN]
        pass

    return unload_ok
