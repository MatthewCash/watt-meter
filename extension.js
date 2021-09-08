'use strict';

const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Clutter = imports.gi.Clutter;

class Extension {
    constructor() {
        this.indicator = null;
        this.label = null;
        this.refreshInterval = null;
    }
    enable() {
        const indicator = new PanelMenu.Button(0.0, 'Watt Meter', false);
        const icon = new St.Icon({
            gicon: new Gio.ThemedIcon({ name: 'emblem-default-symbolic' }),
            style_class: 'system-status-icon',
        });
        const label = new St.Label({ text: 'Loading', y_align: Clutter.ActorAlign.CENTER });
        // indicator.add_child(icon);
        indicator.add_child(label);

        this.indicator = indicator;
        this.label = label;

        Main.panel.addToStatusArea('Watt Meter', indicator);

        this.refresh();
        this.refreshInterval = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, this.refresh.bind(this));
    }
    refresh() {
        const [usageSuccess, usageData] = GLib.file_get_contents('/sys/class/power_supply/BAT0/power_now');
        const [statusSuccess, statusData] = GLib.file_get_contents('/sys/class/power_supply/BAT0/status');

        const charging = statusData.toString().trim() === 'Charging';

        if (!usageSuccess || !statusSuccess) {
            this.label.set_text('Error');
            return true;
        }

        const uW = Number(usageData) / 1000000;

        this.label.set_text(`${charging ? '+' : ''}${uW.toFixed(1)} W`);

        return true;
    }
    disable() {
        this.indicator.destroy();
        this.indicator = null;

        this.label.destroy();
        this.label = null;

        GLib.source_remove(this.refreshInterval);
    }
}

const init = () => {
    return new Extension();
};
