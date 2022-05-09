// const FCM = require("fcm-node");
// import FCM from "fcm-node";
const serviceAccount = {
  type: "service_account",
  project_id: "stack-995ed",
  private_key_id: "393a402f6630823c778e76deb92074e9c7c30366",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7WaGovxzBp7zB\n1VrDgB80TwqtBQfIAZj2/NDqYsmGA4rdvVxUKlVNdoXogPQn0hE6TPNhk7wHcjQY\ni4gQkPppwcHrkG2MBUOvx09FhrUxZKuZO9j9egjGKR5H32X16bhzq8C2LZNqxv7j\n0h8yyfSe9TD8e9bF54J/H0R1ljjD7wGp8Ml1dsGcVvr4vUBZaDJtlb+tQtDkZhRi\nAscYRwMCXHIiAe5Nuhu3rh1BH9MsvQqdDTQFCcmA6K9If8nzDwc1tDutf9/iXBdV\nVUZ1hPDM9oCFwGU/Qyq+If3aIjWmMfk9lATv461K0BhOpLHxU4F0ypblEPZXh/Lp\nAQlP+tuLAgMBAAECggEAO65Q1h2TPol9ks2xbSfKSPKI9xbsJKWFoeBleNThV4SX\nXw2sdM9LfzKrc6ZooKrFfCn5OfNC6ahSuiLwxD461ye266CFlR40MrGuKfrAi6yD\nEXxEInMWinGcyM58f3rlnEtxR1d7Z39ewRo1gAtflqeK5FNa1o5qPq6qMz8YdCmI\n0c43Nw2XU1Y4pODGrPB0kMCFde/nLxbvgeq47ch2BO1sxMKQ81X9HH+fT52eUDHO\n5montTKSKx+0lYYN3pbSpZsPuzLsPVmPXNWG+GlUDk6PSUO+nlVtRdAXOlxJXv0S\nD9XMpRPjjcwSHTzvfEMjPlSq3+CZ/xUr2Fk80B/xyQKBgQD/cExGUagExtRLydUE\nHGz0rq5Usw+hlDQdGyt4mWKdcRGPBNQPTTMvOojaHoHV/Lt70L39iJCYjiMyPVn8\nqfEbWtfFnSkxejjnw81t4Wduinv9b3mDrVPCprhNDKAaCevJ27ZPbaW/lj/+Ae0/\nTzeRvCnk+6MAgvM6YGDtt+MA5wKBgQC7wwdrciEWKm61khd8xzZzG9OclcFHYl3O\n/zOuLzggSwYsR+Wc6NMkB/VB96aigpdXMrYRRzC3bsTz1n9vOdRegI2MliMDzE+E\nfgjyJW6eQkyhq91BUCjfYEulwtu2NcrvpN5zfXP8OkzVNckVmMUWr17q4DPThjws\n+Fig/cAnvQKBgFJ9RWSAAi5oty4yY6QMOfNaZdncaXPYlGvB1mv/vKTzWqRA/upi\nF+Fsmb02lN8x2qnFY1V4wJlDbYJP5bt+depLj9q1QhREUBQoWzLc07YS6q+RTECF\nvMLjbCkVpq5B/e8WEO3djuUr9EZnAOKtBlj91tmnmaAUqc90SFj8RUaJAoGAYZhp\nNec33X6m1wgd30TpP4HaR4zrzwAJRLwQD90JbnewuLmSVzIJ9bORPv3MBrKcmb2J\nN4fqgZ45D4mR6a2Efq6RZN7xSlsbhgHBAqSEUAykKnDb68QPyrQR/hJABAEH//KR\nkjRGYnenUjfH0sr6vuTfEHUDW1Jt2u4nm17qT30CgYEA6lUFlVuP7f9wPxEKkeP/\n0l4Lm88WS3s430bZwNC6VdpvxZ+m7osaKjfEBPxjLj/q368pvKNnBCnpYkiqN2kV\nWux22uz1QVSdUelXduYRm2bmcLGa3ZE9suTVGaeDHWIBVXc9OMY8BlCdbUwHEDBW\n378JF3JO/IFgv9wmkSuEeCo=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-tp43e@stack-995ed.iam.gserviceaccount.com",
  client_id: "111578768458458128917",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-tp43e%40stack-995ed.iam.gserviceaccount.com",
};
// const fcm = new FCM(serviceAccount);
export const sendNotification = (to, body, data, action) => {
  if (to != null) {
    const message = {
      registration_ids: to,
      notification: {
        title: process.env.APP_NAME,
        body: body,
        sound: "default",
        icon: "ic_launcher_notification",
        color: "#ffffff",
        click_action: action,
        data: JSON.stringify(data),
      },
      data: data,
    };
    // fcm.send(message, function (err) {
    //   if (err) {
    //     console.log("Something has gone wrong!", err);
    //   } else {
    //     console.log("Notification Successfully sent");
    //   }
    // });
  }
};
