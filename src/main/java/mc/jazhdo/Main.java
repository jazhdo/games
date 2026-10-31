package mc.jazhdo;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

import org.mariuszgromada.math.janetsudoku.SudokuGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.StringTemplateResolver;

import io.javalin.Javalin;
import io.javalin.config.RoutesConfig;
import io.javalin.rendering.template.JavalinThymeleaf;

public class Main {
    private final Logger log = LoggerFactory.getLogger(Main.class);
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
                if (!"[0:0:0:0:0:0:0:1]".equals(ip) && !"127.0.0.1".equals(ip) && !"100.74.100.100".equals(ip)) {
                    ctx.skipRemainingHandlers();
                    log.info("Request IP {} Forbidden.", ip);
                }
            });
            routes.get("/", ctx -> {
                // Menu page
                Context context = new Context();
                context.setVariables(Map.of("games", List.of(new Game("/flag", "Minesweeper", "/minesweeper"), new Game("data:png;base64,[data_here]", "Sudoku", "/sudoku"))));
                ctx.render("templates/outer.html", Map.of("name", "Home", "content", engine.process(new String(getFile("templates/index.html"), StandardCharsets.UTF_8), context)));
            });
            routes.get("/{page}", ctx -> {
                String page = ctx.pathParam("page");
                switch (page) {
                    case "minesweeper" -> {
                        Context outerContext = new Context();
                        outerContext.setVariables(Map.of("content", engine.process(new String(getFile("templates/minesweeper.html"), StandardCharsets.UTF_8), new Context())));
                        ctx.render("templates/outer.html", Map.of("name", "Minesweeper", "content", engine.process(new String(getFile("templates/main.html"), StandardCharsets.UTF_8), outerContext)));
                    }
                    case "minesweeper.js", "sudoku.js" -> {
                        ctx.contentType("text/javascript");
                        ctx.result(new String(getFile("templates/" + page), StandardCharsets.UTF_8));
                    }
                    case "sudoku" -> {
                        int[][] board;
                        do {
                            board = (new SudokuGenerator()).generate();
                        } while (board == null);
                        Context innerContext = new Context();
                        innerContext.setVariable("rows", board);

                        Context outerContext = new Context();
                        outerContext.setVariables(Map.of("content", engine.process(new String(getFile("templates/sudoku.html"), StandardCharsets.UTF_8), innerContext)));
                        ctx.render("templates/outer.html", Map.of("name", "Sudoku", "content", engine.process(new String(getFile("templates/main.html"), StandardCharsets.UTF_8), outerContext)));
                    }
                    case "win", "normal", "lose", "boom", "bomb", "flag", "wrong" -> {
                        ctx.contentType("image/png");
                        ctx.result(getFile("icons/" + page + ".png"));
                    }
                    case "favicon.ico" -> {
                        ctx.contentType("image/x-icon");
                        ctx.result(getFile("icons/favicon.ico"));
                    }
                    default -> {
                        Context outerContext = new Context();
                        outerContext.setVariables(Map.of("content", engine.process(new String(getFile("templates/error.html"), StandardCharsets.UTF_8), new Context())));
                        ctx.render("templates/outer.html", Map.of("name", "Error 404", "content", engine.process(new String(getFile("templates/main.html"), StandardCharsets.UTF_8), outerContext)));
                    }
                }
            });
        });
        jl.start("0.0.0.0", 3000);
    }
    // Unneeded debug functions
    // private String printMap(Map<String, String> map) {
    //     String output = "\n";
    //     for (Entry<String, String> entry : map.entrySet()) output += entry.getKey() + ": " + entry.getValue() + "\n";
    //     return output;
    // }
    // private String printArrayOfArraysOfInt(int[][] intArray) {
    //     return "[" + Arrays.stream(intArray).map((row) -> "[" + Arrays.stream(row).mapToObj(String::valueOf).collect(Collectors.joining(", ")) + "]").collect(Collectors.joining((", "))) + "]";
    // }
    public record Game(String icon, String name, String url) {}
    private byte[] getFile(String path) {
        // Root folder is resources/ (Note: Deploying on windows causes bug where leading slash is remove (that is required))
        try (InputStream fileStream = ClassLoader.getSystemResourceAsStream(Paths.get(path).normalize().toString())) {
            return fileStream.readAllBytes();
        } catch (IOException ex) {
            return new byte[0];
        } catch (NullPointerException ex) {
            log.warn("Null pointer exception occurred while fetching system resource \"{}\". Error message: {}", new Object[]{path, ex.getMessage()});
            return new byte[0];
        }
    }
}