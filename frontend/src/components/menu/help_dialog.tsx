import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GitHubIcon from "@mui/icons-material/GitHub";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import readme from "../../../../README.md?raw";
import overviewImage from "../../../../docs/images/buffetiser-overview.svg";
import workflowImage from "../../../../docs/images/buffetiser-workflow.svg";
import architectureImage from "../../../../docs/images/buffetiser-architecture.svg";
import logoImage from "../../assets/logo_bk.webp";

const repositoryUrl = "https://github.com/dodgydesigns/buffetiser-2.0";
const bundledImages: Record<string, string> = {
  "frontend/src/assets/logo_bk.webp": logoImage,
  "docs/images/buffetiser-overview.svg": overviewImage,
  "docs/images/buffetiser-workflow.svg": workflowImage,
  "docs/images/buffetiser-architecture.svg": architectureImage,
};

function repositoryAsset(source?: string) {
  if (!source || source.startsWith("http")) return source;
  if (bundledImages[source]) return bundledImages[source];
  return `${repositoryUrl}/raw/main/${source.replace(/^\.\//, "")}`;
}

function repositoryLink(href?: string) {
  if (!href || href.startsWith("#") || href.startsWith("http")) return href;
  return `${repositoryUrl}/blob/main/${href.replace(/^\.\//, "")}`;
}

export default function HelpDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="lg"
      slotProps={{
        paper: {
          sx: {
            width: fullScreen ? "100%" : "95vw",
            maxWidth: fullScreen ? "100%" : "95vw",
            height: fullScreen ? "100%" : "95vh",
            maxHeight: fullScreen ? "100%" : "95vh",
            borderRadius: fullScreen ? 0 : 3,
            overflow: "hidden",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: { xs: 2, sm: 3 },
          py: 2,
          color: "white",
          background:
            "linear-gradient(135deg, #143449 0%, #0f4c75 65%, #3282b8 100%)",
        }}
      >
        <HelpOutlineRoundedIcon fontSize="large" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
            Buffetiser Help
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Installation, everyday use, backups and troubleshooting
          </Typography>
        </Box>
        <Tooltip title="Close">
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <DialogContent
        dividers
        sx={{
          p: 0,
          overflowY: "auto",
          backgroundColor: "#f7fafc",
        }}
      >
        <Box className="help-readme">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              img: ({ src, alt }) => (
                <img src={repositoryAsset(src)} alt={alt ?? ""} />
              ),
              a: ({ href, children }) => (
                <a
                  href={repositoryLink(href)}
                  target={href?.startsWith("#") ? undefined : "_blank"}
                  rel="noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {readme}
          </ReactMarkdown>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button
          startIcon={<GitHubIcon />}
          href={`${repositoryUrl}#readme`}
          target="_blank"
          rel="noreferrer"
        >
          View on GitHub
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
