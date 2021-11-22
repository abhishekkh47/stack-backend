import moment from "moment";

const OTP_MAPPING: Record<string, { validTill: Date; value: string }> = {};

export const saveOtp = async (
  id: string,
  otp: string,
  validTill: Date = moment().add(10, "minutes").toDate()
) => {
  OTP_MAPPING[id] = {
    validTill,
    value: otp,
  };

  console.log(`Otp for id ${id} is ${otp}`);

  return {
    success: true,
  };
};

export const validateOtp = (id: string, value: string) => {
  const mapping = OTP_MAPPING[id];
  if (!mapping) {
    throw new Error("Invalid otp");
  }
  if (mapping.value !== value) {
    throw new Error("Invalid otp");
  }
  const isExpired = moment().isAfter(moment(mapping.validTill));
  if (isExpired) {
    delete OTP_MAPPING[id];
    throw new Error("Otp expired");
  }

  delete OTP_MAPPING[id];

  return {
    success: true,
  };
};
