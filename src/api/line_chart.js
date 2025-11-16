import { baseUrl, getData } from "@/utils/serve";

export const getLineChartData = () => {
  return getData({ url: baseUrl + "/line-chart" });
};
