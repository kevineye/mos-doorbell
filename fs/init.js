load('api_bitbang.js');
load('api_config.js');
load('api_gpio.js');
load('api_http.js');
load('api_log.js');
load('api_mqtt.js');
load('api_rpc.js');
load('ready.js');

let topic_base = Cfg.get('app.mqtt_topic');

function ifttt_trigger(event, values) {
  Log.info("posting to IFTTT:" + event);
  HTTP.query({
    url: 'https://maker.ifttt.com/trigger/' + event + "/with/key/" + Cfg.get('app.ifttt_key'),
    headers: { 'Content-Type': 'application/json' },
    data: values||{},
    success: function() {
      Log.info("IFTTT post complete");
    },
    error: function(err) {
      Log.error("IFTTT post error: " + err);
    }
  });
}

function ding(id) {
  BitBang.write(Cfg.get('doors.d'+id+'.chime'), BitBang.DELAY_MSEC, 0, 0, 750, 0, '\x80', 1);
}

function ring(id) {
  let name = Cfg.get('doors.d'+id+'.name');
  Log.info("pressed " + id + " (" + name + ")");
  ding(id);
  ifttt_trigger('doorbell', { value1: id, value2: name });
  MQTT.pub(topic_base + "/door", '{"door_id":"' + id + '","door_name":"' + name + '"}');
}

for (let i = 0; i < 4; i++) {
  let chime = Cfg.get('doors.d'+JSON.stringify(i)+'.chime');
  GPIO.set_mode(chime, GPIO.MODE_OUTPUT);
  GPIO.write(chime, 1);
}

GPIO.set_button_handler(Cfg.get('doors.d0.button'), GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 10, function() { ring('0'); }, null);
GPIO.set_button_handler(Cfg.get('doors.d1.button'), GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 10, function() { ring('2'); }, null);
GPIO.set_button_handler(Cfg.get('doors.d2.button'), GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 10, function() { ring('3'); }, null);
GPIO.set_button_handler(Cfg.get('doors.d3.button'), GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 10, function() { ring('4'); }, null);

MQTT.sub(topic_base + "/ding", function(conn, topic, msg) {
  Log.info("MQTT received ding: " + msg);
  ding(msg||'0');
}, null);

RPC.addHandler('Doorbell.Ding', function (data) {
  data = data || {};
  data.id = data.id || '0';
  Log.info("RPC received ding " + data.id);
  ding(data.id);
  return {};
});

RPC.addHandler('Test.Press', function (data) {
  data = data || {};
  data.id = data.id || '0';
  Log.info("RPC received test press " + data.id);
  ring(data.id);
  return {};
});
