import axios from "axios";

const API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY;

const BASE_URL = "https://api-sepolia.etherscan.io/api";

export async function getTransactions(address: string) {
  const response = await axios.get(BASE_URL, {
    params: {
      module: "account",
      action: "txlist",
      address,
      startblock: 0,
      endblock: 99999999,
      sort: "desc",
      apikey: API_KEY,
    },
  });

  return response.data.result;
}