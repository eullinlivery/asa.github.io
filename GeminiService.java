
package com.eullin.saraia;

import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;
import java.util.Scanner;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class GeminiService {
    private static final String API_KEY = "TU_API_KEY_AQUI"; // En producción usar BuildConfig o variables de entorno
    private static final String MODEL_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + API_KEY;
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    public interface Callback {
        void onSuccess(String resultBase64);
        void onError(String error);
    }

    public static void paintRoom(String base64Image, Map<String, String> zoneColors, Callback callback) {
        executor.execute(() -> {
            try {
                URL url = new URL(MODEL_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);

                // Construcción del prompt similar al de geminiService.ts
                StringBuilder prompt = new StringBuilder("ROL: Expert en renderització fotorealista d'interiors...\n");
                for (Map.Entry<String, String> entry : zoneColors.entrySet()) {
                    prompt.append("- ").append(entry.getKey().toUpperCase()).append(": Color ").append(entry.getValue()).append("\n");
                }

                // Cuerpo de la petición JSON
                JSONObject jsonBody = new JSONObject();
                JSONArray contents = new JSONArray();
                JSONObject parts = new JSONObject();
                JSONArray partsArray = new JSONArray();

                JSONObject imagePart = new JSONObject();
                JSONObject inlineData = new JSONObject();
                inlineData.put("mimeType", "image/png");
                inlineData.put("data", base64Image);
                imagePart.put("inlineData", inlineData);

                JSONObject textPart = new JSONObject();
                textPart.put("text", prompt.toString());

                partsArray.put(imagePart);
                partsArray.put(textPart);
                parts.put("parts", partsArray);
                contents.put(parts);
                jsonBody.put("contents", contents);

                OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream());
                writer.write(jsonBody.toString());
                writer.flush();

                if (conn.getResponseCode() == 200) {
                    Scanner s = new Scanner(conn.getInputStream()).useDelimiter("\\A");
                    String response = s.hasNext() ? s.next() : "";
                    
                    // Parsear la respuesta para extraer la imagen base64
                    JSONObject respJson = new JSONObject(response);
                    String resultBase64 = respJson.getJSONArray("candidates")
                            .getJSONObject(0)
                            .getJSONObject("content")
                            .getJSONArray("parts")
                            .getJSONObject(0) // Asumiendo que el primer part es la imagen
                            .getJSONObject("inlineData")
                            .getString("data");
                    
                    callback.onSuccess(resultBase64);
                } else {
                    callback.onError("Error de servidor: " + conn.getResponseCode());
                }

            } catch (Exception e) {
                Log.e("GeminiService", "Error", e);
                callback.onError("Error de conexión: " + e.getMessage());
            }
        });
    }
}
