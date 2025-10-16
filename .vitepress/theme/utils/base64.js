// 通用Base64解码函数
export const decodeBase64 = (base64String) => {
  if (!base64String) return null;

  try {
    // 使用浏览器兼容的方式解码Base64
    const binaryString = atob(base64String);
    // 将二进制字符串转换为UTF-8字符串
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    console.error('Error decoding Base64 string:', e);
    return null;
  }
}

// 解码Base64并解析为JSON对象
export const decodeBase64ToJson = (base64String) => {
  const decodedString = decodeBase64(base64String);
  if (!decodedString) return {};

  try {
    return JSON.parse(decodedString);
  } catch (e) {
    console.error('Error parsing JSON from decoded data:', e);
    return {};
  }
}

// 将字符串编码为Base64
export const encodeToBase64 = (str) => {
  if (!str) return '';

  try {
    // 将字符串转换为UTF-8字节数组
    const bytes = new TextEncoder().encode(str);
    // 将字节数组转换为二进制字符串
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    // 编码为Base64
    return btoa(binaryString);
  } catch (e) {
    console.error('Error encoding string to Base64:', e);
    return '';
  }
}

// 将JSON对象编码为Base64字符串
export const encodeJsonToBase64 = (obj) => {
  if (!obj) return '';

  try {
    const jsonString = JSON.stringify(obj);
    return encodeToBase64(jsonString);
  } catch (e) {
    console.error('Error encoding JSON to Base64:', e);
    return '';
  }
}