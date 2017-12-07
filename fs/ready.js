load('api_config.js');
load('api_timer.js');
load('api_log.js');
load('api_gpio.js');
load('api_bitbang.js');
load('api_mqtt.js');

let led_pin = Cfg.get('app.led_pin');
GPIO.set_mode(led_pin, GPIO.MODE_OUTPUT);

Log.info("app initialization starting");

function pulse3() {
  // three fast pulses
  BitBang.write(led_pin, BitBang.DELAY_MSEC, 0, 0, 50, 50, '\xE0', 1);
  GPIO.write(led_pin, 1);
}

let startup_flasher = Timer.set(2000, Timer.REPEAT, pulse3, null);

MQTT.setEventHandler(function(conn, ev, edata) {
  if (ev === MQTT.EV_CONNACK) {
    Log.info("MQTT connected");
    Log.info("app initialization complete");
    Timer.del(startup_flasher);
  }
}, null);
