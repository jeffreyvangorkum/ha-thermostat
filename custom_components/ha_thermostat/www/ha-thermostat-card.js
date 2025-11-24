console.info("HA Thermostat Card: Loading...");
class HAThermostatCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._activeTab = 0; // 0: Overview, 1: Configuration
    this._selectedEntity = null;
  }

  setConfig(config) {
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getCardSize() {
    return 3;
  }

  render() {
    if (!this._hass) return;

    const climateEntities = Object.keys(this._hass.states).filter(
      (eid) => eid.startsWith('climate.')
    );

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .card-header {
          padding: 16px 16px 0;
          font-size: 24px;
          line-height: 32px;
          color: var(--ha-card-header-color, --primary-text-color);
        }
        .tabs {
          display: flex;
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
          margin: 16px 16px 0;
        }
        .tab {
          padding: 8px 16px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          color: var(--secondary-text-color);
        }
        .tab.active {
          border-bottom-color: var(--primary-color);
          color: var(--primary-color);
          font-weight: bold;
        }
        .content {
          padding: 16px;
          flex: 1;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
        }
        .thermostat-box {
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: var(--ha-card-border-radius, 4px);
          padding: 16px;
          text-align: center;
          cursor: pointer;
          transition: background-color 0.2s;
          background-color: var(--card-background-color, white);
        }
        .thermostat-box:hover {
          background-color: var(--secondary-background-color, rgba(0, 0, 0, 0.05));
        }
        .thermostat-name {
          font-weight: bold;
          margin-bottom: 8px;
          color: var(--primary-text-color);
        }
        .thermostat-temp {
          font-size: 1.5em;
          color: var(--primary-text-color);
        }
        .thermostat-state {
          color: var(--secondary-text-color);
        }
        /* Popup Styles */
        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999;
          backdrop-filter: blur(2px);
        }
        .popup {
          background: var(--card-background-color, white);
          padding: 24px;
          border-radius: var(--ha-card-border-radius, 8px);
          width: 300px;
          box-shadow: var(--ha-card-box-shadow, 0 4px 6px rgba(0,0,0,0.1));
          border: 1px solid var(--divider-color, #e0e0e0);
          color: var(--primary-text-color);
        }
        .popup h3 {
          margin-top: 0;
          color: var(--primary-text-color);
        }
        .popup-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
        }
        button {
          padding: 10px;
          cursor: pointer;
          background-color: var(--primary-color);
          color: var(--text-primary-color, white);
          border: none;
          border-radius: 4px;
          font-size: 1em;
          font-weight: 500;
        }
        button.cancel {
          background-color: transparent;
          color: var(--primary-text-color);
          border: 1px solid var(--divider-color);
        }
        button:hover {
          opacity: 0.9;
        }
        .temp-control {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 24px 0;
        }
        .target-temp {
          font-size: 2em;
          font-weight: bold;
          color: var(--primary-text-color);
        }
        .circle-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          padding: 0;
          font-size: 1.5em;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .config-box {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 100px;
        }
        .config-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 8px;
        }
        .action-icon {
          cursor: pointer;
          --mdc-icon-size: 24px;
          color: var(--secondary-text-color);
        }
        .action-icon:hover {
          color: var(--primary-color);
        }
        .action-icon.visible {
          color: var(--success-color, green);
        }
        .action-icon.hidden {
          color: var(--error-color, red);
        }
        .input-container {
          margin: 16px 0;
        }
        input[type="text"] {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          font-size: 1em;
          background: var(--card-background-color, white);
          color: var(--primary-text-color);
        }
      </style>

      <ha-card>
        <div class="tabs">
          <div class="tab ${this._activeTab === 0 ? 'active' : ''}" id="tab-0">Overview</div>
          <div class="tab ${this._activeTab === 1 ? 'active' : ''}" id="tab-1">Configuration</div>
        </div>

        <div class="content">
          ${this._activeTab === 0 ? this.renderOverview(climateEntities) : this.renderConfig()}
        </div>
      </ha-card>

      ${(this._selectedEntity || this._renamingEntity) ? this.renderPopup() : ''}
    `;

    this.shadowRoot.getElementById('tab-0').addEventListener('click', () => { this._activeTab = 0; this.render(); });
    this.shadowRoot.getElementById('tab-1').addEventListener('click', () => { this._activeTab = 1; this.render(); });

    if (this._activeTab === 0) {
      this.shadowRoot.querySelectorAll('.thermostat-box').forEach(box => {
        box.addEventListener('click', (e) => {
          this._selectedEntity = e.currentTarget.dataset.entityId;
          this.render();
        });
      });
    } else if (this._activeTab === 1) {
      this.bindConfigEvents();
    }

    if (this._selectedEntity || this._renamingEntity) {
      this.bindPopupEvents();
    }
  }

  renderOverview(entities) {
    const settings = this._config.entity_settings || {};
    const visibleEntities = entities.filter(eid => {
      const setting = settings[eid];
      return !setting || setting.visible !== false;
    });

    if (visibleEntities.length === 0) {
      return '<div>No visible climate entities. Check Configuration tab.</div>';
    }

    return `
      <div class="grid">
        ${visibleEntities.map(eid => {
      const state = this._hass.states[eid];
      const setting = settings[eid];
      const name = (setting && setting.name) || state.attributes.friendly_name || eid;
      const temp = state.attributes.current_temperature || state.attributes.temperature || 'N/A';
      const unit = this._hass.config.unit_system.temperature;
      return `
            <div class="thermostat-box" data-entity-id="${eid}">
              <div class="thermostat-name">${name}</div>
              <div class="thermostat-temp">${temp} ${unit}</div>
              <div class="thermostat-state">${state.state}</div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  renderConfig() {
    const entities = Object.keys(this._hass.states).filter(eid => eid.startsWith('climate.'));
    const settings = this._config.entity_settings || {};

    return `
      <div class="grid">
        ${entities.map(eid => {
      const state = this._hass.states[eid];
      const setting = settings[eid] || {};
      const isVisible = setting.visible !== false;
      const name = setting.name || state.attributes.friendly_name || eid;

      return `
            <div class="thermostat-box config-box">
              <div class="thermostat-name">${name}</div>
              <div class="config-actions">
                <ha-icon 
                  class="action-icon ${isVisible ? 'visible' : 'hidden'}" 
                  icon="${isVisible ? 'mdi:eye' : 'mdi:eye-off'}"
                  data-action="toggle-visibility"
                  data-entity-id="${eid}"
                ></ha-icon>
                <ha-icon 
                  class="action-icon" 
                  icon="mdi:cog"
                  data-action="rename"
                  data-entity-id="${eid}"
                ></ha-icon>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  renderPopup() {
    if (this._renamingEntity) {
      const settings = this._config.entity_settings || {};
      const setting = settings[this._renamingEntity] || {};
      const state = this._hass.states[this._renamingEntity];
      const currentName = setting.name || (state ? state.attributes.friendly_name : this._renamingEntity);

      return `
        <div class="overlay">
          <div class="popup">
            <h3>Rename ${currentName}</h3>
            <div class="input-container">
              <input type="text" id="rename-input" value="${currentName}" />
            </div>
            <div class="popup-buttons">
              <button id="btn-save-name">Save</button>
              <button id="btn-cancel-rename" class="cancel">Cancel</button>
            </div>
          </div>
        </div>
      `;
    }

    const state = this._hass.states[this._selectedEntity];
    if (!state) return '';

    const settings = this._config.entity_settings || {};
    const setting = settings[this._selectedEntity];
    const name = (setting && setting.name) || state.attributes.friendly_name || this._selectedEntity;
    const currentTemp = state.attributes.temperature !== undefined ? state.attributes.temperature : 20;

    if (this._confirmingOff) {
      return `
        <div class="overlay">
          <div class="popup">
            <h3>Turn Off ${name}?</h3>
            <div class="popup-buttons">
              <button id="btn-confirm-off">Yes, Turn Off</button>
              <button id="btn-cancel-off" class="cancel">No</button>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="overlay">
        <div class="popup">
          <h3>${name}</h3>
          
          <div class="temp-control">
            <button id="btn-down" class="circle-btn">-</button>
            <div class="target-temp">${currentTemp}</div>
            <button id="btn-up" class="circle-btn">+</button>
          </div>

          <div class="popup-buttons">
            <button id="btn-heat">Heat</button>
            <button id="btn-off" class="cancel">Off</button>
            <button id="btn-ok">OK</button>
          </div>
        </div>
      </div>
    `;
  }

  bindPopupEvents() {
    const overlay = this.shadowRoot.querySelector('.overlay');

    const close = () => {
      this._selectedEntity = null;
      this._confirmingOff = false;
      this._renamingEntity = null;
      this.render();
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    if (this._renamingEntity) {
      this.shadowRoot.getElementById('btn-cancel-rename').addEventListener('click', close);
      this.shadowRoot.getElementById('btn-save-name').addEventListener('click', () => {
        const newName = this.shadowRoot.getElementById('rename-input').value;
        this.updateConfig(this._renamingEntity, { name: newName });
        close();
      });
      return;
    }

    if (this._confirmingOff) {
      this.shadowRoot.getElementById('btn-confirm-off').addEventListener('click', () => {
        this.callService('set_hvac_mode', { hvac_mode: 'off' });
        close();
      });
      this.shadowRoot.getElementById('btn-cancel-off').addEventListener('click', () => {
        this._confirmingOff = false;
        this.render();
      });
      return;
    }

    this.shadowRoot.getElementById('btn-ok').addEventListener('click', close);

    this.shadowRoot.getElementById('btn-heat').addEventListener('click', () => {
      this.callService('set_hvac_mode', { hvac_mode: 'heat' });
      close();
    });

    this.shadowRoot.getElementById('btn-off').addEventListener('click', () => {
      this._confirmingOff = true;
      this.render();
    });

    this.shadowRoot.getElementById('btn-up').addEventListener('click', () => this.adjustTemp(0.5));
    this.shadowRoot.getElementById('btn-down').addEventListener('click', () => this.adjustTemp(-0.5));
  }

  updateConfig(entityId, changes) {
    const newConfig = { ...this._config };
    if (!newConfig.entity_settings) {
      newConfig.entity_settings = {};
    }
    newConfig.entity_settings[entityId] = {
      ...(newConfig.entity_settings[entityId] || {}),
      ...changes
    };

    this._config = newConfig;

    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
    this.render();
  }

  // Add event listeners for config tab actions
  bindConfigEvents() {
    this.shadowRoot.querySelectorAll('.action-icon').forEach(icon => {
      icon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent box click
        const action = e.currentTarget.dataset.action;
        const entityId = e.currentTarget.dataset.entityId;

        if (action === 'toggle-visibility') {
          const settings = (this._config.entity_settings || {})[entityId] || {};
          const currentVisible = settings.visible !== false;
          this.updateConfig(entityId, { visible: !currentVisible });
        } else if (action === 'rename') {
          this._renamingEntity = entityId;
          this.render();
        }
      });
    });
  }

  adjustTemp(delta) {
    const state = this._hass.states[this._selectedEntity];
    if (!state) return;
    const currentSet = state.attributes.temperature;
    if (currentSet === undefined) return; // Can't adjust if no setpoint

    this.callService('set_temperature', { temperature: currentSet + delta });
  }

  callService(service, data) {
    this._hass.callService('climate', service, {
      entity_id: this._selectedEntity,
      ...data
    });
    // Close popup after action? Or keep open? User didn't specify.
    // Let's keep it open for temp adjustments, maybe close for mode changes.
    // For now, let's just keep it open.
  }
}

customElements.define('ha-thermostat-card', HAThermostatCard);
