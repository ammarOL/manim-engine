from manim import *

class Scene_e26d93a4_e329_4c48_9912_ce2113ea24fe(Scene):
    def construct(self):
        # Create a right triangle
        triangle = Polygon(
            ORIGIN, 
            3 * RIGHT, 
            4 * RIGHT + 3 * UP, 
            fill_color=BLUE, 
            fill_opacity=0.5, 
            stroke_color=WHITE
        )

        # Create labels for the sides
        a = MathTex("a = 3").next_to(triangle, DOWN).shift(1.5 * RIGHT)
        b = MathTex("b = 4").next_to(triangle, RIGHT).shift(1.5 * UP)
        c = MathTex("c = 5").next_to(triangle, UP).shift(1.5 * RIGHT)

        # Create the equation
        equation = MathTex("a^2 + b^2 = c^2").shift(2 * DOWN)
        equation2 = MathTex("3^2 + 4^2 = 5^2").next_to(equation, DOWN)
        equation3 = MathTex("9 + 16 = 25").next_to(equation2, DOWN)

        # Set the background color to black
        self.camera.background_color = "#000000"

        # Add the triangle and labels
        self.add(triangle, a, b, c, equation, equation2, equation3)