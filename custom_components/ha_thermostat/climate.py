"""Climate platform for HA Thermostat."""
from __future__ import annotations

from homeassistant.components.climate import ClimateEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN

async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the HA Thermostat climate platform."""
    # TODO: Create your entities here.
    # For now, we'll just add a placeholder entity if you want,
    # or leave it empty until we implement the logic.
    # entities = [HaThermostat(entry)]
    # async_add_entities(entities)
    pass


class HaThermostat(ClimateEntity):
    """Representation of a HA Thermostat."""

    def __init__(self, entry: ConfigEntry) -> None:
        """Initialize the thermostat."""
        self._attr_name = "HA Thermostat"
        self._attr_unique_id = f"{entry.entry_id}_thermostat"
        # TODO: Initialize other attributes
