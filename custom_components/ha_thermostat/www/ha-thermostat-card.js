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
        :host {
          display: block;
          --ha-card-background: var(--card-background-color, white);
          --ha-card-box-shadow: var(--ha-card-box-shadow, 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12));
          background: var(--ha-card-background);
          box-shadow: var(--ha-card-box-shadow);
          border-radius: var(--ha-card-border-radius, 4px);
          color: var(--primary-text-color);
          padding: 16px;
        }
        .tabs {
          display: flex;
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
          margin-bottom: 16px;
        }
        .tab {
          padding: 8px 16px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }
        .tab.active {
          border-bottom-color: var(--primary-color);
          font-weight: bold;
        }
        .content {
          min-height: 200px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
        }
        .thermostat-box {
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .thermostat-box:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        .thermostat-name {
          font-weight: bold;
          margin-bottom: 8px;
        }
        .thermostat-temp {
          font-size: 1.5em;
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
        }
        .popup {
          background: var(--ha-card-background);
          padding: 24px;
          border-radius: 8px;
          width: 300px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .popup h3 {
          margin-top: 0;
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
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1em;
        }
        button.cancel {
          background-color: var(--secondary-text-color, #757575);
        }
      </style>

      <div class="tabs">
        <div class="tab ${this._activeTab === 0 ? 'active' : ''}" id="tab-0">Overview</div>
        <div class="tab ${this._activeTab === 1 ? 'active' : ''}" id="tab-1">Configuration</div>
      </div>

      <div class="content">
        ${this._activeTab === 0 ? this.renderOverview(climateEntities) : this.renderConfig()}
      </div>

      ${this._selectedEntity ? this.renderPopup() : ''}
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
        }

        if (this._selectedEntity) {
            this.bindPopupEvents();
        }
    }

    renderOverview(entities) {
        if (entities.length === 0) {
            return '<div>No climate entities found.</div>';
        }
        return `
      <div class="grid">
        ${entities.map(eid => {
            const state = this._hass.states[eid];
            const temp = state.attributes.current_temperature || state.attributes.temperature || 'N/A';
            const unit = this._hass.config.unit_system.temperature;
            return `
            <div class="thermostat-box" data-entity-id="${eid}">
              <div class="thermostat-name">${state.attributes.friendly_name || eid}</div>
              <div class="thermostat-temp">${temp} ${unit}</div>
              <div>${state.state}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    }

    renderConfig() {
        return '<div>Configuration coming soon...</div>';
    }

    renderPopup() {
        const state = this._hass.states[this._selectedEntity];
        const name = state ? (state.attributes.friendly_name || this._selectedEntity) : this._selectedEntity;

        return `
      <div class="overlay">
        <div class="popup">
          <h3>${name}</h3>
          <div class="popup-buttons">
            <button id="btn-heat">HVAC Heat</button>
            <button id="btn-off">HVAC Off</button>
            <button id="btn-up">Temperature Up</button>
            <button id="btn-down">Temperature Down</button>
            <button id="btn-cancel" class="cancel">Cancel</button>
          </div>
        </div>
      </div>
    `;
    }

    bindPopupEvents() {
        const overlay = this.shadowRoot.querySelector('.overlay');
        const cancelBtn = this.shadowRoot.getElementById('btn-cancel');

        // Close on cancel or background click
        const close = () => {
            this._selectedEntity = null;
            this.render();
        };

        cancelBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // Actions
        this.shadowRoot.getElementById('btn-heat').addEventListener('click', () => this.callService('set_hvac_mode', { hvac_mode: 'heat' }));
        this.shadowRoot.getElementById('btn-off').addEventListener('click', () => this.callService('set_hvac_mode', { hvac_mode: 'off' }));

        // For temp up/down, we need current setpoint.
        // This is a simplified implementation.
        this.shadowRoot.getElementById('btn-up').addEventListener('click', () => this.adjustTemp(1));
        this.shadowRoot.getElementById('btn-down').addEventListener('click', () => this.adjustTemp(-1));
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
