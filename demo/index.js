var url_protocol = window.location.protocol;
var url_host = window.location.host;
var rtc_server = url_protocol + "//" + url_host;

console.log("rtc_server", rtc_server);

var onlineUsers = null;

// ----------------------------------------------
// Cached dom elements
// ----------------------------------------------

var $online_status = $(".tlr-status");
var $online_users_btn = $(".tlr-online-users");

function infoTemplate(params) {
  var body = "";
  var title = "";

  if (params.name.indexOf("status") !== -1) {
    title = "Connection Status";
  }

  if (params.name.indexOf("users") !== -1) {
    title = "Online Users";
  }

  if (params.empty) {
    var text = "";

    if (params.name === "status_disconnected") {
      text =
        "You are not connected. Please set the required fields and connect.";
    }

    if (params.name === "users_empty") {
      text = "There are no online users in your room.";
    }

    body =
      '<div class="empty"><p>' +
      text +
      '</p><div class="quick-connect-btn">Connect</div></div>';
  }

  if (params.name === "status_connected") {
    body =
      "" +
      '<ul class="status-list">' +
      "<li>username : " +
      easyrtc.idToName(easyrtc.myEasyrtcid) +
      "</li>" +
      "<li>room : " +
      Object.keys(easyrtc.getRoomsJoined())[0] +
      "</li>" +
      "<li>rtc_id : " +
      easyrtc.myEasyrtcid +
      "</li>" +
      "<li>server : " +
      tlr.config.rtc_server +
      "</li>" +
      "<li style='font-weight:bold; margin: 7px 0px'>Presence</li>" +
      "<li>code : " +
      tlr.selfInfo.presence.code +
      "</li>" +
      "<li>state : " +
      tlr.selfInfo.presence.state +
      "</li>" +
      "<li>status : " +
      tlr.selfInfo.presence.status +
      "</li>" +
      "<li class='update-presence-btn'>Update presence</li>" +
      "</ul>";
  }

  if (params.name === "users_online") {
    var lis = "";

    onlineUsers.forEach(function (user) {
      lis +=
        "" +
        '<li data-username="' +
        user.username +
        '">' +
        '<img src="' +
        user.avatar +
        '" class="online-user-avatar" onerror="tlr.fixImage(this, \'person\')"/>' +
        '<span class="name">' +
        user.full_name +
        "</span>" +
        '<div class="user-actions-box">' +
        '<i class="material-icons action call-btn">call</i>' +
        '<i class="material-icons action chat-btn">chat</i>' +
        '<i class="material-icons action cobrowsing-btn">assistant</i>' +
        "</div>" +
        "</li>";
    });

    body = '<ul class="users-list">' + lis + "</ul>";
  }

  var html =
    "" +
    '<div id="' +
    params.name +
    '" class="tlr-info">' +
    '<div class="header">' +
    '<div class="title">' +
    title +
    "</div>" +
    '<i class="material-icons close-btn">close</i>' +
    "</div>" +
    body +
    "</div>";

  $("body").append(html);

  if (params.name === "users_online") {
    $(".tlr-info li").on("click", ".action", function () {
      var username = $(this).parent().parent().attr("data-username");

      if ($(this).hasClass("call-btn")) {
        tlr.performCall(username);
      } else if ($(this).hasClass("chat-btn")) {
        // OPEN CHAT
        tlr.chat.open([tlr.config.user.username, username]);
      } else if ($(this).hasClass("cobrowsing-btn")) {
        tlr.cobrowsing.requestConnection(username);
      }
    });
  }

  if (params.name === "status_connected") {
    $(".tlr-info .update-presence-btn").on("click", function () {
      tlr.updatePresenceUi();
    });
  }

  if (params.name === "status_disconnected") {
    $(".tlr-info .quick-connect-btn").on("click", function () {
      $(".tlr-info").remove();
      _connect();
    });
  }

  $(".tlr-info .close-btn").on("click", function () {
    $(this).parent().parent().remove();
  });
}

function openInfo(params) {
  var $info = $(".tlr-info");

  if ($info.attr("id") === params.name) {
    $info.remove();
    return;
  }

  if ($info.length > 0) {
    $info.each(function () {
      $(this).remove();
    });
  }

  if (params.name === "status_connected") {
    infoTemplate({
      name: params.name,
    });
  }

  if (params.name === "status_disconnected") {
    infoTemplate({
      name: params.name,
      empty: true,
    });
  }

  if (params.name === "users_online") {
    infoTemplate({
      name: params.name,
      users: params.users,
    });
  }

  if (params.name === "users_empty") {
    infoTemplate({
      name: params.name,
      empty: true,
    });
  }
}

function generateToken() {}

function updateOnlineStatus(onOff) {
  var $text = $online_status.find(".text");
  var status = onOff ? "Connected" : "Disconnected";

  $online_status.toggleClass("online", onOff);
  $text.text(status);

  if (onOff) {
    $("#connect")
      .html("Disconnect")
      .toggleClass("red", true)
      .toggleClass("green", false);
    $("#customize form").toggleClass("no-border", false);
    $("#apply_changes").css("display", "block");
  } else {
    $("#connect")
      .html("Connect")
      .toggleClass("red", false)
      .toggleClass("green", true);
    $("#customize form").toggleClass("no-border", true);
    $("#apply_changes").css("display", "none");
  }
}

// ----------------------------------------------
// Clicks
// ----------------------------------------------

$(".card-title-box").on("click", function () {
  $(this).parent().toggleClass("info-expanded");
});

var _connect = function () {
  if (easyrtc.myEasyrtcid) {
    tlr.disconnect();
  } else {
    var configured = config();

    if (!configured) {
      return false;
    }

    tlr
      .connect()
      .then(function () {
        saveCredentialsInLS();
      })
      .catch(function (error) {
        updateOnlineStatus(false);

        console.log("### CONNECT : ERROR :", error);

        tlr.notify({
          icon: "warning",
          icon_color: "red",
          message:
            "Error connecting to the rtc server. Error code: " +
            error.code +
            ". Error message: " +
            error.message,
          autohide: true,
        });
      });
  }
};

$("#connect").on("click", _connect);

$("#apply_changes").on("click", function () {
  if (tlr.callInProgress()) {
    return;
  }

  tlr.disconnect().then(function () {
    var configured = config();

    if (!configured) {
      updateOnlineStatus(false);

      tlr.notify({
        icon: "warning",
        icon_color: "red",
        message:
          "Error changing settings. Please check your configuration field values and try again.",
        autohide: true,
      });

      return false;
    }

    tlr
      .connect()
      .then(function () {
        tlr.notify({
          icon: "refresh",
          icon_color: "green",
          message: "You have successfully updated settings",
          autohide: true,
        });
      })
      .catch(function (errCode) {
        updateOnlineStatus(false);

        tlr.notify({
          icon: "warning",
          icon_color: "red",
          message: "Error connecting to the rtc server. Error code: " + errCode,
          autohide: true,
        });
      });
  });
});

$("#generate_token").on("click", function () {
  $("#client_id_1").toggleClass("error", false);
  $("#client_token_1").toggleClass("error", false);

  var client_id = $("#client_id_1").val();
  var client_token = $("#client_token_1").val();

  if (client_id === "" || client_token === "") {
    if (client_id === "") {
      $("#client_id_1").toggleClass("error", true);
    }

    if (client_token === "") {
      $("#client_token_1").toggleClass("error", true);
    }

    tlr.notify({
      icon: "warning",
      icon_color: "red",
      message: "Please provide the Client ID and Client token and try again!",
      autohide: true,
    });

    return;
  }

  $.post(
    "/api/auth/",
    {
      client_id: client_id,
      client_token: client_token,
    },
    function (data, status, xhr) {
      if (data.error) {
        tlr.notify({
          icon: "warning",
          icon_color: "red",
          message: "Error generating token: " + data.error,
          autohide: true,
        });
      } else {
        var token_html =
          "" +
          '<div id="auth_token_box" class="response-box">' +
          '<div class="res-info">You have successfully generated the auth token. Your Auth token and Client ID are copied to the Authentication fields.</div>' +
          '<div class="res-label">Auth token:</div>' +
          '<div class="res-link" id="auth_token_value">' +
          data.data.auth_token +
          "</div>" +
          "</div>";

        $("#user_account").attr("id", "demo_account").text("Use demo account");
        $("#auth_fields").show();

        $("#client_id").toggleClass("error", false).val(client_id);
        $("#client_token").toggleClass("error", false).val("");
        $("#auth_token").toggleClass("error", false).val(data.data.auth_token);

        $("#generate_token").remove();
        $("#generate_auth_token").append(token_html);
      }
    }
  );
});

$("#quick_call").on("click", function () {
  if (!tlr.connected) {
    tlr.notify({
      icon: "warning",
      icon_color: "red",
      message: "You are not connected. Please connect and try again.",
      autohide: true,
    });

    return;
  }

  var invited_person_name = $("#invited_person_name").val();

  if (invited_person_name === "") {
    invited_person_name = "Test " + Math.floor(100000 + Math.random() * 900000);
    $("#invited_person_name").val(invited_person_name);
  }

  tlr.quickLinks
    .createLink(invited_person_name)
    .then(function (data) {
      var localtime = new Date(data.expiration_time)
        .toString()
        .split(" GMT")[0];

      var link_html =
        "" +
        '<div class="quick-link-box">' +
        '<div class="label">Quick call link for ' +
        invited_person_name +
        ",</div>" +
        '<div class="expiration">expires at ' +
        localtime +
        ".</div>" +
        '<a class="link" href="' +
        data.quick_call_link +
        '" target="_blank">' +
        data.quick_call_link +
        "</a>" +
        "</div>";

      copyTextToClipboard(data.quick_call_link);

      $("#quick_call_links").append(link_html);

      $("#invited_person_name").val("");
    })
    .catch(function (error) {
      tlr.notify({
        icon: "warning",
        icon_color: "red",
        message: "Error: " + error,
        autohide: true,
      });
    });
});

$("#support_code_btn").on("click", function () {
  if (!tlr.connected) {
    tlr.notify({
      icon: "warning",
      icon_color: "red",
      message: "You are not connected. Please connect and try again.",
      autohide: true,
    });

    return;
  }

  tlr.supportCode
    .createSupportCode()
    .then(function (data) {
      var localtime = new Date(data.expiration_time)
        .toString()
        .split(" GMT")[0];

      var code_html =
        "" +
        '<div class="quick-link-box">' +
        '<div class="label">Support code ' +
        data.quick_call_token +
        ",</div>" +
        '<div class="expiration">expires at ' +
        localtime +
        ".</div>" ;

      copyTextToClipboard(data.quick_call_token);

      $("#create_support_code").append(code_html);
    })
    .catch(function (error) {
      tlr.notify({
        icon: "warning",
        icon_color: "red",
        message: "Error: " + error,
        autohide: true,
      });
    });
});

$("#open_quick_links_list").on("click", function () {
  if (!tlr.connected) {
    tlr.notify({
      icon: "warning",
      icon_color: "red",
      message: "You need to be connected in order to view quick links.",
      autohide: true,
    });
  } else {
    tlr.quickLinks.openList();
  }
});

$("#media_message_btn").on("click", function () {
  if (!tlr.connected) {
    tlr.notify({
      icon: "warning",
      icon_color: "red",
      message: "You are not connected. Please coonect first and try again.",
      autohide: true,
    });

    return;
  }

  var recipient_name = $("#recipient_name").val();

  if (recipient_name === "") {
    recipient_name = "Test " + Math.floor(100000 + Math.random() * 900000);
    $("#recipient_name").val(recipient_name);
  }

  tlr.createMediaMessage({
    recipient_name: recipient_name,
  });

  $("#recipient_name").val("");
});

$("#screencast_btn").on("click", function () {
  if (!tlr.connected) {
    tlr.notify({
      icon: "warning",
      icon_color: "red",
      message: "You are not connected. Please connect, and try again.",
      autohide: true,
    });

    return;
  }

  var title = $("#screencast_title").val();

  if (title === "") {
    title = "Screencast " + Math.floor(100000 + Math.random() * 900000);
    $("#screencast_title").val(title);
  }

  tlr.createMediaMessage({
    screencast: true,
    title: title,
  });

  $("#screencast_title").val("");
});

$("#open_av_messages").on("click", function () {
  if (!tlr.connected) {
    tlr.notify({
      icon: "warning",
      icon_color: "red",
      message: "You need to be connected in order to view your messages.",
      autohide: true,
    });
  } else {
    tlr.AVMessages.open();
  }
});

$("#online_users_list").on("click", "li", function () {
  var username = $(this).attr("data-username");
  tlr.performCall(username);
});

$(".link-btn").on("click", function () {
  var id = $(this).attr("id");

  if (id === "demo_account") {
    var demo_client_id = "syldemo";
    var demo_client_token = "265697885748763436541355943228197879285666311";

    $(this).text("Use your client account");
    $(this).attr("id", "user_account");

    $("#auth_fields").hide();
    $("#client_id").val(demo_client_id);
    $("#client_token").val(demo_client_token);
  } else if (id === "user_account") {
    $(this).text("Use demo account");
    $(this).attr("id", "demo_account");

    $("#client_id").val("");
    $("#client_token").val("");
    $("#auth_token").val("");
    $("#auth_fields").show();
  }
});

$("#confroom_btn").on("click", tlr.confRoom.open);

$("#open_confrooms_list").on("click", tlr.confRoom.openList);

$("#call_phone_number_btn").on("click", tlr.phoneCall.open);

$("#send_sms_btn").on("click", tlr.sms.open);

$("form input").on("change", function () {
  $(this).toggleClass("error", false);
});

$online_status.on("click", function () {
  var status = $(this).hasClass("online") ? "connected" : "disconnected";
  openInfo({ name: "status_" + status });
});

$online_users_btn.on("click", function () {
  var online = onlineUsers && onlineUsers.length ? "online" : "empty";
  openInfo({ name: "users_" + online });
});

$("#open_popup").on("click", function (e) {
  if (!tlr.connected) {
    tlr.notify({
      icon: "warning",
      icon_color: "red",
      message: "You are not connected! Please connect and try again.",
      autohide: true,
    });
  } else {
    tlr.popup.open();
  }
});

$("#open_confrooms_recordings").on("click", tlr.confRoom.openRecordings);

// ----------------------------------------------
// TALARIA
// ----------------------------------------------

function getTalariaToken() {
  console.log("# getTalariaToken : START");
  return new Promise((resolve, reject) => {
    $.post(
      "/api/auth/",
      {
        client_id: $("#client_id").val(),
        client_token: $("#client_token").val(),
      },
      function (data, status, xhr) {
        var res_obj = JSON.parse(data);
        console.log("# getTalariaToken : END : ", res_obj);

        if (!res_obj.success) {
          reject(res_obj.error);
        } else {
          resolve(res_obj.data.auth_token);
        }
      },
      function (err) {
        console.log("# getTalariaToken : ERROR :", err);
      }
    );
  });
}

function config() {
  $("#config_and_connect input").each(function (i, el) {
    $(el).toggleClass("error", false);
  });

  var ui_mode = $("#ui_mode").val();
  var start_call_with_cam = $("#start_call_with_cam").val();

  if (start_call_with_cam === "true") {
    start_call_with_cam = true;
  } else if (start_call_with_cam === "false") {
    start_call_with_cam = false;
  } else {
    start_call_with_cam = true;
  }

  var single_incoming_call_only = $("#single_incoming_call_only").val();

  if (single_incoming_call_only === "false") {
    single_incoming_call_only = false;
  } else if (single_incoming_call_only === "true") {
    single_incoming_call_only = true;
  } else {
    single_incoming_call_only = false;
  }

  var call_to_conf = $("#call_to_conf").val();

  if (call_to_conf === "false") {
    call_to_conf = false;
  } else if (call_to_conf === "true") {
    call_to_conf = true;
  } else {
    call_to_conf = true;
  }

  var show_buttons_label = $("#show_buttons_label").val();

  if (show_buttons_label === "true") {
    show_buttons_label = true;
  } else if (show_buttons_label === "false") {
    show_buttons_label = false;
  } else {
    show_buttons_label = false;
  }

  var language = $("#language").val() || "en";
  var ui_size = $("#ui_size").val();
  var room_name = $("#room_name").val();
  var username_prefix = $("#username_prefix").val();
  var user_id = $("#user_id").val();
  var full_name = $("#full_name").val();
  var user_email = $("#user_email").val();
  var client_id = $("#client_id").val();
  var client_token = $("#client_token").val();
  var auth_token = null;

  var credentials = {
    client_id: client_id,
  };

  if ($("#auth_token").val() !== "") {
    credentials.auth_token = $("#auth_token").val();
  } else {
    credentials.client_token = client_token;
  }

  var has_errors = false;

  if (user_id === "") {
    $("#user_id").toggleClass("error", true);
    has_errors = true;
  }

  if (full_name === "") {
    $("#full_name").toggleClass("error", true);
    has_errors = true;
  }

  if (client_id === "") {
    $("#client_id").toggleClass("error", true);
    has_errors = true;
  }

  if (client_token === "" && auth_token === "") {
    $("#client_token").toggleClass("error", true);
    $("#auth_token").toggleClass("error", true);
    has_errors = true;
  }

  if (has_errors) {
    return false;
  }

  tlr.configure({
    room_name: room_name,
    ui_size: ui_size,
    language: language,
    show_buttons_label: show_buttons_label,
    ui_mode: ui_mode,
    start_call_with_cam: start_call_with_cam,
    single_incoming_call_only: single_incoming_call_only,
    call_to_room_transition: call_to_conf,
    rtc_server: rtc_server,
    user: {
      email: user_email || null,
      username_prefix: username_prefix,
      id: user_id,
      full_name: full_name,
    },
    avatar_path: "https://i.pravatar.cc/150?img={id}",
    credentials: credentials,
    //using i18n keys you can override any UI copy from tlr-client/app/langs/en.js language file
    i18n: {
      processing_message: "Processing your message, please wait...",
      message_uploaded:
        "Your message is ready, here is the message link that you can send to the message recipient.",
    },
    contacts: [
      {
        id: "0001",
        full_name: "Justin Shaw",
      },
      {
        id: "0002",
        full_name: "Oscar Walker",
      },
      {
        id: "0003",
        full_name: "William McKnight",
      },
      {
        id: "0004",
        full_name: "Joseph Watson",
      },
      {
        id: "0005",
        full_name: "Anthony Harris",
      },
      {
        id: "0006",
        full_name: "Martha Taylor",
      },
      {
        id: "0007",
        full_name: "Krista Martin",
      },
      {
        id: "0008",
        full_name: "Carolyn Goldberg",
      },
      {
        id: "0009",
        full_name: "Tracie Amon",
      },
      {
        id: "0010",
        full_name: "Elicia White",
      },
    ],
    getFreshAuthToken: getTalariaToken,
    // You will need that if you want to
    // to save chat messages on your server
    // chat_message_getter: getChatMessages,
    // chat_message_setter: saveChatMessage
  });

  if (
    tlr.config.credentials.hasOwnProperty("auth_token") &&
    tlr.config.credentials.hasOwnProperty("client_token")
  ) {
    delete tlr.config.credentials.client_token;
  }

  return true;
}

tlr.on("onlinepresencechanged", function (_onlineUsers) {
  $(".counter").text(_onlineUsers.length);
  onlineUsers = _onlineUsers;

  if ($("#users_online").length > 0 || $("#users_empty").length) {
    var online = onlineUsers && onlineUsers.length ? "online" : "empty";
    openInfo({ name: "users_" + online });
  }

  if ($("#status_connected").length > 0) {
    $("#status_connected").remove();
  }
});

tlr.on("connected", function (_onlineUsers) {
  updateOnlineStatus(true);
});

tlr.on("disconnected", function (_onlineUsers) {
  updateOnlineStatus(false);
});

tlr.on("confroomjoined", function (roomInfo) {
  console.log("# Conference room joined :", roomInfo);
});

tlr.on("confroomleft", function (roomInfo) {
  console.log("# Conference room left :", roomInfo);
});

/*
tlr.on("popupclosed", function(){
  // this will prevent reconnection in main window
  tlr.popup.preventReconnect();
});
*/

function saveChatMessage(message) {
  console.log("### saveChatMessage :", message);
  var _message = {
    participants: message.participants.join(),
    created_at: message.created_at,
    created_by: message.created_by,
  };

  if (message.file) {
    _message.file = JSON.stringify(message.file);
  }

  if (message.text) {
    _message.text = message.text;
  }

  let data = {
    message: _message,
    client_id: tlr.config.credentials.client_id,
  };

  if ($("#auth_token").val()) {
    data.auth_token = $("#auth_token").val();
  } else {
    data.client_token = $("#client_token").val();
  }

  return new Promise(function (resolve, reject) {
    $.ajax({
      type: "POST",
      url: "/api/save_chat_message/",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
      success: function (res) {
        resolve();
      },
    });
  });
}

function getChatMessages(participants) {
  return new Promise(function (resolve, reject) {
    var data = {
      client_id: $("#client_id").val(),
      participants: participants.join(),
    };

    if ($("#auth_token").val()) {
      data.auth_token = $("#auth_token").val();
    } else {
      data.client_token = $("#client_token").val();
    }

    $.get("/api/get_chat_conversation/", data, function (data) {
      var messages = data.data.map(function (msg) {
        msg.participants = msg.participants.split(",");
        if (msg.file) {
          msg.file = JSON.parse(msg.file);
        }
        return msg;
      });
      resolve(messages);
    });
  });
}

tlr.init();

function saveCredentialsInLS() {
  localStorage.setItem("user_id", $("#user_id").val());
  localStorage.setItem("user_full_name", $("#full_name").val());
  localStorage.setItem("client_id", $("#client_id").val());
  localStorage.setItem("client_token", $("#client_token").val());
  localStorage.setItem("auth_token", $("#auth_token").val());
}

function tryCredentialsFromLS() {
  var user_id = localStorage.getItem("user_id");
  if (user_id) {
    $("#user_id").val(user_id);
  }

  var user_full_name = localStorage.getItem("user_full_name");
  if (user_full_name) {
    $("#full_name").val(user_full_name);
  }

  var client_id = localStorage.getItem("client_id");
  if (client_id) {
    $("#client_id").val(client_id);
  }

  var client_token = localStorage.getItem("client_token");
  if (client_token) {
    $("#client_token").val(client_token);
  }

  var auth_token = localStorage.getItem("auth_token");
  if (auth_token) {
    $("#client_token").val("");
    $("#auth_token").val(auth_token);
  }
}

tryCredentialsFromLS();

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {}
}
