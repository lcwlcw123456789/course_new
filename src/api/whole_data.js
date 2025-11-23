import { baseUrl, getData } from "@/utils/serve";

export const getWholeData = () => {
  return getData({ url: baseUrl + `/data` });
};
