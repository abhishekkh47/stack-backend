import * as yup from "yup";

export const SendGiftCardValidation = yup.object().shape({
  amount: yup.number().required("Amoount is required"),
  cvv: yup.string().required("CVV is required"),
});
