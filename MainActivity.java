
// MainActivity.java
public class MainActivity extends AppCompatActivity {
    // Aquí pegas la API KEY que sacaste de AI Studio
    private final String MI_API_KEY = "TU_API_KEY_AQUÍ";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Button btnEntrar = findViewById(R.id.btnEntrar);
        btnEntrar.setOnClickListener(v -> {
            // Aquí pones la lógica para llamar a Gemini
            ejecutarSARA();
        });
    }

    private void ejecutarSARA() {
        // Esta es la parte que "traduce" tu prompt de la web a Android
        String miPrompt = "Especificacions de la restauració: Actúa como SARA IA...";
        // Aquí iría la llamada al SDK de Google que copiaste en el botón Get Code
    }
}