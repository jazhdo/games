package mc.jazhdo;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
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

import com.caoccao.javet.swc4j.Swc4j;
import com.caoccao.javet.swc4j.enums.Swc4jMediaType;
import com.caoccao.javet.swc4j.options.Swc4jTranspileOptions;

import io.javalin.Javalin;
import io.javalin.config.RoutesConfig;
import io.javalin.rendering.template.JavalinThymeleaf;

public class Main {
    private final Logger log = LoggerFactory.getLogger(Main.class);
    private TemplateEngine engine;
    private Javalin jl;

    public void main(String[] args) {
        // Create template engine for use on subpages
        engine = new TemplateEngine();
        engine.setTemplateResolver(new StringTemplateResolver());

        // Start the web server
        jl = Javalin.create(config -> {
            // Thymeleaf
            config.fileRenderer(new JavalinThymeleaf());

            // Routes
            RoutesConfig routes = config.routes;
            routes.before(ctx -> {
                // Log request
                log.info("Request: {} -> {}{}", ctx.method(), ctx.host(), ctx.path());

                // // Check hostname
                // String ip = ctx.ip();
                // if (!"[0:0:0:0:0:0:0:1]".equals(ip) && !"127.0.0.1".equals(ip) && !"100.74.100.100".equals(ip)) {
                //     ctx.skipRemainingHandlers();
                //     log.info("Request IP {} Forbidden.", ip);
                // }
            });
            routes.get("/", ctx -> {
                // Menu page
                Context context = new Context();
                context.setVariables(Map.of("games", List.of(new Game("/flag", "Minesweeper", "/minesweeper"), new Game("/sudoku.png", "Sudoku", "/sudoku"), new Game("/tictactoe.png", "Tic Tac Toe", "/tictactoe"))));
                ctx.render("templates/outer.html", Map.of("name", "Home", "content", engine.process(new String(getFile("templates/index.html"), StandardCharsets.UTF_8), context)));
            });
            routes.get("/{page}", ctx -> {
                String page = ctx.pathParam("page");
                switch (page) {
                    case "minesweeper" -> renderPage("Minesweeper", "templates/minesweeper.html", ctx, new Context());
                    case "minesweeper.js", "sudoku.js" -> {
                        ctx.contentType("text/javascript");
                        ctx.result(new String(getFile("templates/" + page), StandardCharsets.UTF_8));
                    }
                    case "sudoku.ts", "tictactoe.ts", "minesweeper.ts", "snake.ts" -> {
                        ctx.contentType("text/javascript");
                        ctx.result(new Swc4j().transpile(new String(getFile("templates/" + page), StandardCharsets.UTF_8), new Swc4jTranspileOptions().setSpecifier(URI.create("file:///" + page).toURL()).setMediaType(Swc4jMediaType.TypeScript)).getCode());
                    }
                    case "sudoku" -> {
                        int[][] board;
                        do {
                            board = (new SudokuGenerator()).generate();
                        } while (board == null);
                        Context innerContext = new Context();
                        innerContext.setVariable("rows", board);
                        renderPage("Sudoku", "templates/sudoku.html", ctx, innerContext);
                    }
                    case "tictactoe" -> renderPage("Tic Tac Toe", "templates/tictactoe.html", ctx, new Context());
                    case "snake" -> renderPage("Snake", "templates/snake.html", ctx, new Context());
                    case "win", "normal", "lose", "boom", "bomb", "flag", "wrong", "sudoku.png", "tictactoe.png" -> {
                        ctx.contentType("image/png");
                        ctx.result(getFile("icons/" + page + ".png"));
                    }
                    case "apple" -> {
                        ctx.contentType("image/svg");
                        ctx.result(getFile("icons/" + page + ".svg"));
                    }
                    case "favicon.ico" -> {
                        ctx.contentType("image/x-icon");
                        ctx.result(getFile("icons/favicon.ico"));
                    }
                    default -> renderPage("Error 404", "templates/error.html", ctx, new Context());
                }
            });
        });
        try {
            jl.start("0.0.0.0", Integer.parseInt(System.getenv("PORT")));
        } catch (NumberFormatException ex) {
            jl.start("0.0.0.0", 443);
        }
    }
    private void renderPage(String title, String path, io.javalin.http.Context routeContext, Context pageContext) {
        Context outerContext = new Context();
        outerContext.setVariable("content", engine.process(new String(getFile(path), StandardCharsets.UTF_8), pageContext));
        routeContext.render("templates/outer.html", Map.of("name", title, "content", engine.process(new String(getFile("templates/main.html"), StandardCharsets.UTF_8), outerContext)));
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