package mc.jazhdo;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.StringTemplateResolver;

import io.javalin.Javalin;
import io.javalin.config.RoutesConfig;
import io.javalin.rendering.template.JavalinThymeleaf;

public class Main {
    private Logger log = LoggerFactory.getLogger(Main.class);
    private Javalin jl;

    public void main(String[] args) {
        // Create template engine for use on subpages
        TemplateEngine engine = new TemplateEngine();
        engine.setTemplateResolver(new StringTemplateResolver());

        // Start the web server
        Javalin jl = Javalin.create(config -> {
            // Thymeleaf
            config.fileRenderer(new JavalinThymeleaf());

            // Routes
            RoutesConfig routes = config.routes;
            routes.before(ctx -> {
                // Log request
                log.info("Request: {} -> {}{}", ctx.method(), ctx.host(), ctx.path());

                // Check hostname
                String ip = ctx.ip();
                if (!"[0:0:0:0:0:0:0:1]".equals(ip)) {
                    ctx.skipRemainingHandlers();
                    log.info("Request IP {} Forbidden.", ip);
                }
            });
            routes.get("/", ctx -> {
                // Menu page

                // TODO: Load icons via bytes and into data URIs here
                Context context = new Context();
                context.setVariables(Map.of("games", List.of(new Game("data:png;base64,[data_here]", "Minesweeper", "/minesweeper"), new Game("data:png;base64,[data_here]", "Sudoku", "/sudoku"))));
                ctx.render("templates/outer.html", Map.of("name", "Home", "content", engine.process(new String(getFile("/index.html"), StandardCharsets.UTF_8), context)));
            });
            routes.get("/{page}", ctx -> {
                switch (ctx.pathParam("page")) {
                    case "minesweeper" -> {
                        Context outerContext = new Context(), innerContext = new Context();
                        outerContext.setVariables(Map.of("content", engine.process(new String(getFile("/minesweeper.html"), StandardCharsets.UTF_8), innerContext)));
                        ctx.render("templates/outer.html", Map.of("name", "Minesweeper", "content", engine.process(new String(getFile("/main.html"), StandardCharsets.UTF_8), outerContext)));
                    }
                    case "sudoku" -> {

                    }
                    default -> {
                        // 404 Error page
                    }
                };
            });
        });
        jl.start("0.0.0.0", 3000);
    }
    // private String printMap(Map<String, String> map) {
    //     String output = "\n";
    //     for (Entry<String, String> entry : map.entrySet()) output += entry.getKey() + ": " + entry.getValue() + "\n";
    //     return output;
    // }
    public record Game(String icon, String name, String url) {
        public String getIcon() {
            return icon;
        }
        public String getName() {
            return name;
        }
        public String getUrl() {
            return url;
        }
    }

    private byte[] getFile(String path) {
        // Root folder is resources/ (Note: Deploying on windows causes bug where leading slash is remove (that is required))
        try (InputStream fileStream = ClassLoader.getSystemResourceAsStream("templates" + Paths.get(path).normalize().toString())) {
            return fileStream.readAllBytes();
        } catch (IOException e) {
            return new byte[]{};
        }
    }
}